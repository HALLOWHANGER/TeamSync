import { useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import SectionTitle from "../components/section-title";

type FaqItem = {
  question: string;
  answer: string;
};

const FaqSection: React.FC = () => {
  const [isOpen, setIsOpen] = useState<number | null>(null);

  const data: FaqItem[] = [
    {
      question: "What is this Todo app and how does it help me?",
      answer:
        "This Todo app helps you organize tasks, set priorities, and track progress in one simple interface. It’s designed to keep you focused and productive every day.",
    },
    {
      question: "Can I create multiple task lists or projects?",
      answer:
        "Yes, you can create multiple lists or projects to organize tasks by category such as work, school, or personal goals.",
    },
    {
      question: "Can I set deadlines and reminders?",
      answer:
        "Absolutely. You can assign due dates to tasks and set reminders so you never miss important deadlines.",
    },
    {
      question: "Can I edit or delete tasks after creating them?",
      answer:
        "Yes, tasks can be edited, marked as completed, or deleted at any time to keep your list up to date.",
    },
    {
      question: "Does the app save my tasks automatically?",
      answer:
        "Yes, your tasks are saved automatically so you don’t lose progress when you refresh or close the app.",
    },
    {
      question: "Can I access my tasks on different devices?",
      answer:
        "If you create an account, your tasks can sync across devices, allowing you to manage your todos from anywhere.",
    },
  ];

  return (
    <section className="flex flex-col items-center justify-center">
      <SectionTitle
        title="FAQ's"
        description="Find answers to common questions about how our Todo app works and how it helps you stay organized."
      />

      <div className="mx-auto mt-12 w-full max-w-xl">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex flex-col border-b border-gray-200 bg-white"
          >
            <h3
              className="flex cursor-pointer items-start justify-between gap-4 py-4 font-medium"
              onClick={() =>
                setIsOpen(isOpen === index ? null : index)
              }
            >
              {item.question}
              {isOpen === index ? (
                <MinusIcon className="size-5 text-gray-500" />
              ) : (
                <PlusIcon className="size-5 text-gray-500" />
              )}
            </h3>

            <p
              className={`pb-4 text-sm/6 text-gray-500 ${
                isOpen === index ? "block" : "hidden"
              }`}
            >
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FaqSection;