import React from "react";
import {
  DribbbleIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
} from "lucide-react";

import Logo from "@/components/logo";


const Footer: React.FC = () => {
  return (
    <footer className="px-4 pt-30 text-gray-600 md:px-16 lg:px-24">
      <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:gap-16">
        <div className="flex-1">
        <a href="https://prebuiltui.com?utm_source=slidex" className="flex gap-2 font-medium">
          <Logo />
          Team Sync.

        </a>


          <p className="mt-6 max-w-sm text-sm/6">
            Team Sync is a powerful AI-powered platform that allows you to create and manage your team's tasks and projects effortlessly.
          </p>

          <div className="mt-2 flex items-center gap-3 text-gray-400">
            <a
              href="/"
              aria-label="YouTube"
              title="YouTube"
            >
              <DribbbleIcon className="size-5 transition duration-200 hover:-translate-y-0.5" />
            </a>

            <a
              href="/"
              aria-label="Instagram"
              title="Instagram"
            >
              <InstagramIcon className="size-5 transition duration-200 hover:-translate-y-0.5" />
            </a>

            <a
              href="/"
              aria-label="Twitter"
              title="Twitter"
            >
              <TwitterIcon className="size-5 transition duration-200 hover:-translate-y-0.5" />
            </a>

            <a
              href="/"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <LinkedinIcon className="size-5 transition duration-200 hover:-translate-y-0.5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col items-start justify-around gap-8 md:flex-1 md:flex-row md:gap-20">
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-gray-200 py-4 md:flex-row">
        <p className="text-center">
          Copyright 2026 ©{" "}
            Team Sync
          All Right Reserved.
        </p>

        <div className="flex items-center gap-6">
          <a
            href="/"
            className="transition duration-200 hover:text-black"
          >
            Privacy Policy
          </a>

          <a
            href="/"
            className="transition duration-200 hover:text-black"
          >
            Terms of Service
          </a>

          <a
            href="/"
            className="transition duration-200 hover:text-black"
          >
            Cookie Policy
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;