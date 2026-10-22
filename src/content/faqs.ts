import type { FaqItem } from "../types/content";

/** Consumed by the FAQ page UI and by the FAQPage JSON-LD schema. */
export const faqs: FaqItem[] = [
  {
    id: "cost",
    category: "pricing",
    question: "How much does it cost?",
    answer:
      "It depends on the job. We always tell you the cost before we start, and the final bill matches what we agreed. You pay the actual expense plus our service charge — nothing is added afterwards.",
  },
  {
    id: "payment",
    category: "pricing",
    question: "How do I pay from the Gulf?",
    answer:
      "You can pay us after the work is done, using the method that is easiest for you. We send the bill with photos first, so you always see what you are paying for.",
  },
  {
    id: "trust",
    category: "trust",
    question: "Who actually goes to my parents' house?",
    answer:
      "A person from our team, or a worker we have checked ourselves. They carry an ID. For repairs and outside workers, our coordinator stays with them for the whole visit.",
  },
  {
    id: "proof",
    category: "trust",
    question: "How do I know the work was really done?",
    answer:
      "Every job comes back with photos, the bill and a short message on WhatsApp. You see what happened even though you are thousands of kilometres away.",
  },
  {
    id: "start",
    category: "process",
    question: "How do I start?",
    answer:
      "Send us one message with what your family needs. We reply with the plan, who will go and what it will cost. If you agree, we do it.",
  },
  {
    id: "urgent",
    category: "process",
    question: "What if it is urgent?",
    answer:
      "Tell us it is urgent in your first message. Hospital and emergency requests are handled first.",
  },
  {
    id: "language",
    category: "process",
    question: "Will my parents understand your person?",
    answer:
      "Yes. Our people speak the local language, and we explain everything to your parents calmly before anything happens in their home.",
  },
  {
    id: "areas",
    category: "coverage",
    question: "Which places do you cover?",
    answer:
      "Ask us with the exact area. If we do not cover it directly, we will tell you honestly instead of promising something we cannot do.",
  },
];
