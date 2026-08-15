import fs from "fs";
import path from "path";

const localesDir = path.join("web", "src", "i18n", "locales");
const enPath = path.join(localesDir, "en", "common.json");

if (!fs.existsSync(enPath)) {
  console.error("English common.json not found!");
  process.exit(1);
}

const enData = JSON.parse(fs.readFileSync(enPath, "utf8"));
const notificationsBlock = enData.notifications;

if (!notificationsBlock) {
  console.error("notifications block not found in English common.json!");
  process.exit(1);
}

const languages = fs.readdirSync(localesDir).filter(f => {
  return fs.statSync(path.join(localesDir, f)).isDirectory() && f !== "en";
});

for (const lang of languages) {
  const filePath = path.join(localesDir, lang, "common.json");
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    // Add notifications block if not exists or merge
    data.notifications = {
      ...notificationsBlock,
      ...(data.notifications || {})
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`Synced notifications translations for: ${lang}`);
  }
}

console.log("All languages synchronized successfully.");
