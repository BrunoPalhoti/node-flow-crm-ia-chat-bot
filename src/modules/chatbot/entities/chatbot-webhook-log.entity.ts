import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * Auditoria de webhooks recebidos (inclui rejeições de autenticação).
 * session_id permanece nulo quando a chamada é rejeitada antes da sessão.
 */
@Entity({ name: "chatbot_webhook_logs" })
export class ChatbotWebhookLog {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar", name: "session_id", nullable: true })
  sessionId!: string | null;

  @Column({ type: "varchar", length: 50, name: "event_type" })
  eventType!: string;

  @Column({ type: "varchar", length: 100, name: "correlation_id" })
  correlationId!: string;

  @Column({ type: "text", name: "request_payload" })
  requestPayload!: string;

  @Column({ type: "text", name: "response_payload", nullable: true })
  responsePayload!: string | null;

  @Column({ type: "integer", name: "status_code", nullable: true })
  statusCode!: number | null;

  @Column({ type: "varchar", length: 30, name: "processing_status" })
  processingStatus!: string;

  @Column({ type: "text", name: "error_message", nullable: true })
  errorMessage!: string | null;

  @Column({ type: "datetime", name: "received_at" })
  receivedAt!: Date;
}
