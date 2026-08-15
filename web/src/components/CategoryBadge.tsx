import React from "react";
import { useTranslation } from "react-i18next";
import { IssueCategory } from "../lib/api";

interface CategoryBadgeProps {
  category: IssueCategory;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const { t } = useTranslation();

  const getCategoryConfig = (cat: IssueCategory) => {
    switch (cat) {
      case "water":
        return { labelKey: "category.water", bg: "var(--sdg-water-light)", fg: "var(--sdg-water)" };
      case "education":
        return { labelKey: "category.education", bg: "var(--sdg-edu-light)", fg: "var(--sdg-edu)" };
      case "civic":
        return { labelKey: "category.civic", bg: "var(--sdg-civic-light)", fg: "var(--sdg-civic)" };
      default:
        return { labelKey: "category.other", bg: "var(--sdg-other-light)", fg: "var(--sdg-other)" };
    }
  };

  const { labelKey, bg, fg } = getCategoryConfig(category);
  const label = t(labelKey, { defaultValue: category });

  return (
    <span
      className="badge"
      aria-label={label}
      style={{ backgroundColor: bg, color: fg, border: `1px solid ${fg}22`, fontWeight: 700 }}
    >
      {label}
    </span>
  );
};