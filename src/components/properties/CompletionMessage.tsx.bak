import React from "react";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

interface CompletionMessageProps {
  completionMessage: {
    title: string;
    message: string;
    actions: { label: string; href: string }[];
  } | null;
}

export default function CompletionMessage({ completionMessage }: CompletionMessageProps) {
  if (!completionMessage) return null;

  return (
    <div
      className={`mb-6 p-4 border rounded-md text-sm ${completionMessage.title === "Daily Limit Reached" ? "border-yellow-200 bg-yellow-50 text-yellow-700" : "border-green-200 bg-green-50 text-green-700"}`}
    >
      <div className="flex items-start">
        {completionMessage.title === "Daily Limit Reached" ? (
          <XCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-yellow-500" />
        ) : (
          <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" />
        )}
        <div>
          <p className="font-medium mb-1">{completionMessage.title}</p>
          <p>{completionMessage.message}</p>
          {completionMessage.actions.length > 0 && (
            <div className="mt-3 flex gap-3">
              {completionMessage.actions.map((action, index) => (
                <a
                  key={index}
                  href={action.href}
                  className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${completionMessage.title === "Daily Limit Reached" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-green-100 text-green-800 hover:bg-green-200"}`}
                >
                  {action.label} →
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}