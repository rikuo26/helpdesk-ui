import { health, getTickets } from "@/lib/api";

export default async function Page() {
  const ping = await health();
  const tickets = await getTickets();
  return (
    <main style={{ padding: 24 }}>
      <h1>Debug</h1>
      <h2>Health</h2>
      <pre>{JSON.stringify(ping, null, 2)}</pre>
      <h2>Tickets (raw)</h2>
      <pre>{JSON.stringify(tickets, null, 2)}</pre>
    </main>
  );
}
