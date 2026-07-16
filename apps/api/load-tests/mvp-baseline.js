import http from "k6/http";
import { check, fail, sleep } from "k6";

const requiredVariables = [
  "LOAD_TEST_BASE_URL",
  "LOAD_TEST_STUDENT_EMAIL",
  "LOAD_TEST_STUDENT_PASSWORD",
  "LOAD_TEST_TEACHER_EMAIL",
  "LOAD_TEST_TEACHER_PASSWORD"
];

for (const variable of requiredVariables) {
  if (!__ENV[variable]) {
    throw new Error(`La variable ${variable} es obligatoria.`);
  }
}

const BASE_URL = __ENV.LOAD_TEST_BASE_URL.replace(/\/+$/, "");
const PROFILE = __ENV.LOAD_TEST_PROFILE || "smoke";
const LOCAL_TARGET = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(
  BASE_URL
);

if (!/\/api$/i.test(BASE_URL)) {
  throw new Error(
    "LOAD_TEST_BASE_URL debe incluir el prefijo /api, por ejemplo http://localhost:4000/api."
  );
}

if (!LOCAL_TARGET && __ENV.LOAD_TEST_CONFIRM_NON_PRODUCTION !== "true") {
  throw new Error(
    "El destino es remoto. Define LOAD_TEST_CONFIRM_NON_PRODUCTION=true solo después de confirmar que no es producción."
  );
}

if (!["smoke", "baseline"].includes(PROFILE)) {
  throw new Error("LOAD_TEST_PROFILE debe ser smoke o baseline.");
}

const smokeScenario = (exec) => ({
  // Smoke valida una sola vez el flujo completo de cada rol y termina rapido.
  executor: "per-vu-iterations",
  exec,
  vus: 1,
  iterations: 1,
  maxDuration: "1m"
});

const baselineScenario = (exec) => ({
  // Baseline simula pocos usuarios concurrentes que reutilizan su sesion durante 5 minutos.
  executor: "constant-vus",
  exec,
  vus: 2,
  duration: "5m",
  gracefulStop: "30s"
});

const scenario = PROFILE === "baseline" ? baselineScenario : smokeScenario;

export const options = {
  // k6 limpia cookies entre iteraciones por defecto. El baseline debe conservarlas
  // para que cada VU inicie sesion una sola vez, como lo haria un usuario real.
  noCookiesReset: PROFILE === "baseline",
  scenarios: {
    student: scenario("studentJourney"),
    teacher: scenario("teacherJourney")
  },
  thresholds: {
    checks: ["rate>0.99"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1200", "p(99)<2500"]
  }
};

// Los modulos de k6 se instancian por VU: cada VU conserva su propio estado.
let authenticated = false;
let authenticationError = null;

export function studentJourney() {
  runJourney({
    role: "student",
    email: __ENV.LOAD_TEST_STUDENT_EMAIL,
    password: __ENV.LOAD_TEST_STUDENT_PASSWORD,
    classesPath: "/classroom/student/classes"
  });
}

export function teacherJourney() {
  runJourney({
    role: "teacher",
    email: __ENV.LOAD_TEST_TEACHER_EMAIL,
    password: __ENV.LOAD_TEST_TEACHER_PASSWORD,
    classesPath: "/classroom/teacher/classes"
  });
}

function runJourney({ role, email, password, classesPath }) {
  authenticateOnce({ role, email, password });
  baselinePause(1, 2);

  const session = http.get(`${BASE_URL}/auth/me`, requestOptions(role, "session"));
  const sessionBody = safeJson(session);
  const sessionOk = check(session, {
    [`${role}: sesión responde 200`]: (response) => response.status === 200,
    [`${role}: sesión contiene usuario`]: () => Boolean(sessionBody && sessionBody.id)
  });
  if (!sessionOk) stopJourney(`${role}: la sesión autenticada no es válida.`);

  baselinePause(1, 2);

  const classes = http.get(`${BASE_URL}${classesPath}`, requestOptions(role, "classes_list"));
  const classList = safeJson(classes);
  const classesOk = check(classes, {
    [`${role}: listado de clases responde 200`]: (response) => response.status === 200,
    [`${role}: listado de clases es un arreglo`]: () => Array.isArray(classList),
    [`${role}: usuario tiene al menos una clase`]: () =>
      Array.isArray(classList) && classList.length > 0
  });
  if (!classesOk || !Array.isArray(classList) || !classList[0]?.id) {
    stopJourney(
      `${role}: no tiene clases disponibles; asigna al menos una clase antes de ejecutar la carga.`
    );
  }

  baselinePause(1, 2);

  const classId = classList[0].id;
  const detail = http.get(
    `${BASE_URL}/classroom/classes/${encodeURIComponent(classId)}`,
    requestOptions(role, "class_detail")
  );
  const detailBody = safeJson(detail);
  check(detail, {
    [`${role}: detalle de clase responde 200`]: (response) => response.status === 200,
    [`${role}: detalle corresponde a la clase solicitada`]: () => detailBody?.id === classId
  });

  // Pausa entre recorridos para evitar un loop artificial de solicitudes locales.
  baselinePause(2, 3);
}

function authenticateOnce({ role, email, password }) {
  if (authenticated) return;
  if (authenticationError) stopJourney(authenticationError);

  const jar = http.cookieJar();
  jar.clear(BASE_URL);

  const login = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    requestOptions(role, "login", { "Content-Type": "application/json" })
  );
  const loginOk = check(login, {
    [`${role}: login responde 200/201`]: (response) => [200, 201].includes(response.status),
    [`${role}: login crea cookie de sesión`]: () => {
      const cookies = jar.cookiesForURL(BASE_URL);
      return Boolean(cookies.homeschool_access_token && cookies.homeschool_access_token.length);
    }
  });

  if (!loginOk) {
    authenticationError = `${role}: no fue posible iniciar sesión; no se reintentará el login en este VU.`;
    stopJourney(authenticationError);
  }
  authenticated = true;
}

function baselinePause(minSeconds, maxSeconds) {
  if (PROFILE !== "baseline") return;
  sleep(minSeconds + Math.random() * (maxSeconds - minSeconds));
}

function stopJourney(message) {
  // Evita reintentos sin pausa si las credenciales, la sesión o los datos son inválidos.
  baselinePause(3, 3);
  fail(message);
}

function requestOptions(role, operation, headers) {
  return {
    headers,
    tags: { role, operation }
  };
}

function safeJson(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}
