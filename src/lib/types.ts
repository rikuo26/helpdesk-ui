// src/lib/types.ts
export type TicketStatus = "open" | "pending" | "closed" | string;

export interface Ticket {
  Id: number;
  Title: string;
  Body: string;
  Status: TicketStatus;
  CreatedByUpn: string | null;
  CreatedAt: string;       // ISO
  LastUpdatedAt: string;   // ISO
}

export interface TicketReply {
  Id: number;
  TicketId: number;
  AgentUpn: string | null;
  Body: string;
  CreatedAt: string;       // ISO
}

export interface TicketUpdate {
  Id: number;
  TicketId: number;
  AuthorUpn: string | null;
  Kind: "progress" | "status" | string;
  Message: string | null;
  NewStatus: TicketStatus | null;
  CreatedAt: string;       // ISO
}

export interface TicketDetail extends Ticket {
  Replies?: TicketReply[];
  Updates?: TicketUpdate[];
}


