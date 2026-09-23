export interface FaqItem {
  id: string;
  category: "pricing" | "trust" | "process" | "coverage";
  question: string;
  answer: string;
}

export interface Principle {
  title: string;
  description: string;
}
