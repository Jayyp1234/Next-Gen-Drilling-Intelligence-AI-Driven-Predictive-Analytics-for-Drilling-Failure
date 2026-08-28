"use client";
/** First-run flag — decides whether sign-in goes to /welcome or straight in. */
const KEY = "dg-onboarded";
export const isOnboarded = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };
export const setOnboarded = () => { try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ } };
export const resetOnboarding = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };
