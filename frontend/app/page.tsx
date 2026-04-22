// explanation about why those changes were done.
// Keeps home page focused on the core ticket submission workflow.

// Internal working of code
// Server page renders heading + TicketForm client component.
import TicketForm from "../components/TicketForm";

export default function HomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Submit Support Ticket</h1>
      <p className="text-sm text-slate-600">
        Enter customer ticket text to classify category/urgency and route automatically.
      </p>
      <TicketForm />
    </section>
  );
}
