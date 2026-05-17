export type Verdict = "SAFE" | "SUSPICIOUS" | "PHISHING";
export type Severity = "info" | "low" | "medium" | "high";

export type HeuristicFinding = {
  id: string;
  category: "header" | "sender" | "link" | "content" | "attachment";
  severity: Severity;
  title: string;
  detail: string;
  evidence?: string;
};

export type ParsedLink = {
  href: string;
  anchorText: string;
  isMismatch: boolean;
  hostname: string;
};

export type ParsedAttachment = {
  filename: string;
  contentType: string;
  riskyExtension: boolean;
};

export type ReceivedHop = {
  index: number;
  raw: string;
  fromHost: string | null;
  fromIp: string | null;
  byHost: string | null;
  protocol: string | null;
  date: string | null;
  timestamp: number | null;
  gapMs: number | null;
};

export type ParsedEmail = {
  raw: string;
  fromHeader: string | null;
  fromDisplayName: string | null;
  fromAddress: string | null;
  fromDomain: string | null;
  replyTo: string | null;
  returnPath: string | null;
  subject: string | null;
  date: string | null;
  toHeader: string | null;
  authResults: {
    spf: AuthStatus;
    dkim: AuthStatus;
    dmarc: AuthStatus;
    raw: string | null;
  };
  bodyText: string;
  bodyHtml: string | null;
  links: ParsedLink[];
  attachments: ParsedAttachment[];
  receivedChain: ReceivedHop[];
};

export type AuthStatus =
  | "pass"
  | "fail"
  | "softfail"
  | "neutral"
  | "none"
  | "temperror"
  | "permerror"
  | "unknown";

export type HeuristicReport = {
  parsed: ParsedEmail;
  findings: HeuristicFinding[];
  heuristicScore: number;
};

export type LlmRedFlag = {
  title: string;
  severity: Severity;
  explanation: string;
  evidence?: string;
};

export type LlmAnalysis = {
  verdict: Verdict;
  riskScore: number;
  summary: string;
  redFlags: LlmRedFlag[];
  legitimateSignals: string[];
  recommendedActions: string[];
  educationalTakeaway: string;
};

export type AnalysisResponse = {
  parsed: {
    fromHeader: string | null;
    fromDisplayName: string | null;
    fromAddress: string | null;
    fromDomain: string | null;
    replyTo: string | null;
    subject: string | null;
    date: string | null;
    authResults: ParsedEmail["authResults"];
    linkCount: number;
    attachmentCount: number;
    receivedChain: ReceivedHop[];
  };
  heuristicFindings: HeuristicFinding[];
  analysis: LlmAnalysis;
  meta: {
    model: string;
    latencyMs: number;
  };
};

export type UrlParts = {
  input: string;
  normalized: string;
  protocol: string;
  hostname: string;
  unicodeHostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  username: string;
  password: string;
  registrableDomain: string;
  tld: string;
  subdomainDepth: number;
};

export type UrlVerdict = "SAFE" | "SUSPICIOUS" | "MALICIOUS";

export type UrlFinding = {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  evidence?: string;
};

export type UrlLlmAnalysis = {
  verdict: UrlVerdict;
  riskScore: number;
  summary: string;
  redFlags: LlmRedFlag[];
  legitimateSignals: string[];
  recommendedActions: string[];
  educationalTakeaway: string;
};

export type UrlInspectionResponse = {
  parts: UrlParts;
  heuristicFindings: UrlFinding[];
  heuristicScore: number;
  analysis: UrlLlmAnalysis;
  meta: {
    model: string;
    latencyMs: number;
  };
};
