import TicketForm from "../components/TicketForm";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <div className="glass fade-in-up rounded-2xl px-5 py-6 md:px-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-muted)" }}>
          AI-Powered Support Operations
        </div>
        <h1 className="text-3xl font-bold md:text-4xl">Submit Support Ticket</h1>
        <p className="mt-3 max-w-2xl text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>
          Route tickets instantly with dual-model predictions, confidence gating, and seamless human-in-the-loop review.
        </p>
      </div>

      <TicketForm />
    </section>
  );
}
