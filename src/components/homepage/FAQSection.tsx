import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const FAQSection = () => {
  const faqs = [
    {
      question: "How accurate is the parsing from PDFs and text?",
      answer: "Our parsing engine handles 95%+ of common timesheet formats accurately. It recognizes dates, times, client names, and rates from text, WhatsApp messages, and PDF rotas. When it's unsure, it flags items for your review."
    },
    {
      question: "What formats are supported for import?",
      answer: "Plain text (copy/paste), PDF files, PNG/JPG images (with OCR), and CSV files. We also handle common formats like Excel timesheets and agency portal exports."
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer: "Absolutely. We offer a 30-day money-back guarantee on all paid plans. You can also try the 7-day free trial of Pro features before committing."
    },
    {
      question: "How do I export my data?",
      answer: "Click 'Export' from any view to download your shifts as CSV. This includes all shift details, earnings calculations, and payment status. Your data is always portable."
    },
    {
      question: "Is my personal data safe and private?",
      answer: "Yes. We use row-level security (RLS) so your data is completely isolated. We don't share data with third parties, and you can delete your account and all data anytime."
    },
    {
      question: "What's your support response time?",
      answer: "Free users get community support (usually 24-48 hours). Pro users get priority email support with guaranteed 4-hour response during UK business hours."
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Frequently asked questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about Shift Manager
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border border-border rounded-lg px-6 bg-card"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2 pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Still have questions?
          </p>
          <button className="text-primary hover:text-primary-glow transition-colors font-medium">
            Contact our support team →
          </button>
        </div>
      </div>
    </section>
  );
};