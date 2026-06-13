function enabled(value: string | undefined) {
  return value === "true";
}

export const publicFeatures = {
  playtesting: enabled(import.meta.env.VITE_ENABLE_PLAYTESTING),
  tripoModels: enabled(import.meta.env.VITE_ENABLE_TRIPO_MODELS),
  websitePublishing: enabled(import.meta.env.VITE_ENABLE_WEBSITE_PUBLISHING),
};
