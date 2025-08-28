import { z } from "zod";
import { humanizeFieldName } from "@/lib/utils";

const customErrorMap: z.core.$ZodErrorMap = (issue) => {
  const field = humanizeFieldName(String(issue.path));
  switch (issue.code) {
    case "invalid_type":
      if (issue.expected === "string") return `${field} is required.`;
      return "Invalid input.";
    case "too_small":
      if (issue.origin === "string")
        return `${field} must be at least ${issue.minimum} characters.`;
      if (issue.origin === "number")
        return `${field} value must be at least ${issue.minimum}.`;
      return "Too small.";
    case "too_big":
      if (issue.origin === "string")
        return `${field} must be at most ${issue.maximum} characters.`;
      if (issue.origin === "number")
        return `${field} value must be no more than ${issue.maximum}.`;
      return "Too large.";
    case "invalid_format":
      if (issue.format === "email") return "Enter a valid email address.";
      return "Invalid format.";
    default:
      return issue.message;
  }
};

z.config({
  customError: customErrorMap,
});

export { z };
