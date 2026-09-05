import {
  BellIcon,
  BrushCleaningIcon,
  FolderIcon,
  FolderTreeIcon,
  LockKeyholeIcon,
  ShieldCheckIcon,
  UserIcon,
  WrenchIcon,
} from "lucide-react";

export const settingsSections = [
  { slug: "profile", title: "Profile", icon: UserIcon },
  { slug: "appearance", title: "Appearance", icon: BrushCleaningIcon },
  { slug: "categories", title: "Categories", icon: FolderIcon },
  { slug: "category-groups", title: "Category groups", icon: FolderTreeIcon },
  { slug: "notifications", title: "Notifications", icon: BellIcon },
  { slug: "security", title: "Security", icon: LockKeyholeIcon },
  { slug: "privacy", title: "Privacy", icon: ShieldCheckIcon },
  { slug: "troubleshooting", title: "Troubleshooting", icon: WrenchIcon },
] as const;

export type SettingsSection = (typeof settingsSections)[number]["slug"];
