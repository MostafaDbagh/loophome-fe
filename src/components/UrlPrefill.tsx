"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, type ComponentType } from "react";

/**
 * A form that starts with fields filled in from the URL (?title=… from the hero assistant, see
 * lib/prefill.ts). The page's HTML has the form without them (prerendered pages don't know the
 * search params); the filled-in form replaces it as soon as the page loads.
 */
export function withUrlPrefill<P extends object, T>(Form: ComponentType<P & { prefill?: T }>, read: (params: URLSearchParams) => T) {
  function FromUrl(props: P) {
    const params = useSearchParams();
    return <Form key={params.toString()} {...props} prefill={read(new URLSearchParams(params.toString()))} />;
  }
  return function WithUrlPrefill(props: P) {
    return (
      <Suspense fallback={<Form {...props} />}>
        <FromUrl {...props} />
      </Suspense>
    );
  };
}
