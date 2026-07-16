import { Module } from "@nestjs/common";

// REST conversations live in ConversationsModule. This module remains reserved
// for broadcasting conversation updates over WebSockets in the next realtime pass.
@Module({})
export class RealtimeModule {}
