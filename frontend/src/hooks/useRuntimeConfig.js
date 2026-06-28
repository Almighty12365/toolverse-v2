import { useEffect, useMemo, useState } from "react";
import { buildRuntimeConfig } from "../lib/runtime";
import { TOOLS, TOOL_CATEGORIES } from "../lib/tools";

const adaptFeatureToTool = (f) => ({
  id: f.key,
  name: f.name,
  desc: f.description || "",
  category: f.category || "general",
  endpoint: f.endpoint || null,
  client: f.client_handler || null,
  color: f?.metadata?.color || "from-fuchsia-500 to-cyan-500",
  accept: f?.metadata?.accept || "pdf",
  multi: !!f?.metadata?.multi,
  noFile: !!f?.metadata?.noFile,
  icon: null,
});

export const useRuntimeConfig = () => {
  const [state, setState] = useState({
    loading: true,
    error: null,
    config: null,
  });

  useEffect(() => {
    let active = true;
    buildRuntimeConfig()
      .then((cfg) => {
        if (!active) return;
        setState({ loading: false, error: null, config: cfg });
      })
      .catch((error) => {
        if (!active) return;
        setState({ loading: false, error, config: null });
      });
    return () => {
      active = false;
    };
  }, []);

  const runtimeTools = useMemo(() => {
    const registry =
      state.config?.feature_registry ||
      state.config?.features ||
      [];

    if (!registry.length) return TOOLS;

    return registry
      .filter((f) => (f.flags?.enabled ?? true) !== false)
      .map((f) => {
        const staticMatch = TOOLS.find((t) => t.id === f.key);
        if (staticMatch) return { ...staticMatch, ...adaptFeatureToTool(f), icon: staticMatch.icon };
        return adaptFeatureToTool(f);
      });
  }, [state.config]);

  const runtimeCategories = useMemo(() => {
    if (state.config?.categories?.length) {
      return state.config.categories;
    }
    const seen = new Set();
    const generated = runtimeTools
      .map((t) => t.category)
      .filter(Boolean)
      .filter((cat) => {
        if (seen.has(cat)) return false;
        seen.add(cat);
        return true;
      })
      .map((cat) => ({ id: cat, label: cat }));
    return generated.length ? generated : TOOL_CATEGORIES;
  }, [runtimeTools, state.config]);

  return {
    loading: state.loading,
    error: state.error,
    config: state.config,
    tools: runtimeTools,
    categories: runtimeCategories,
  };
};
