"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationParticipantType = exports.ConversationStatus = exports.PostStatus = exports.GroupVisibility = void 0;
var GroupVisibility;
(function (GroupVisibility) {
    GroupVisibility["PRIVATE"] = "PRIVATE";
    GroupVisibility["SCHOOL_WIDE"] = "SCHOOL_WIDE";
})(GroupVisibility || (exports.GroupVisibility = GroupVisibility = {}));
var PostStatus;
(function (PostStatus) {
    PostStatus["DRAFT"] = "DRAFT";
    PostStatus["PUBLISHED"] = "PUBLISHED";
    PostStatus["ARCHIVED"] = "ARCHIVED";
})(PostStatus || (exports.PostStatus = PostStatus = {}));
var ConversationStatus;
(function (ConversationStatus) {
    ConversationStatus["OPEN"] = "OPEN";
    ConversationStatus["ESCALATED"] = "ESCALATED";
    ConversationStatus["CLOSED"] = "CLOSED";
})(ConversationStatus || (exports.ConversationStatus = ConversationStatus = {}));
var ConversationParticipantType;
(function (ConversationParticipantType) {
    ConversationParticipantType["STUDENT"] = "STUDENT";
    ConversationParticipantType["TEACHER"] = "TEACHER";
    ConversationParticipantType["PARENT"] = "PARENT";
    ConversationParticipantType["DIRECTOR"] = "DIRECTOR";
})(ConversationParticipantType || (exports.ConversationParticipantType = ConversationParticipantType = {}));
//# sourceMappingURL=communication.js.map
