import { ArrowRightIcon } from "lucide-react";
import SectionTitle from "../components/section-title";

const CallToActionSection: React.FC = () => {
  return (
    <section className="flex flex-col items-center justify-center py-20">
      <SectionTitle
        title="Try Team Sync for Free"
        description="Team Sync is a powerful platform that provides ready-to-use, customizable TO-DO templates."
      />

      <a
        href="/sign-up"
        className="mt-4 flex items-center gap-2 rounded-full bg-gray-900 px-8 py-2.5 font-medium text-white transition hover:opacity-90"
      >
        Try now
        <ArrowRightIcon className="size-5" />
      </a>
    </section>
  );
};

export default CallToActionSection;