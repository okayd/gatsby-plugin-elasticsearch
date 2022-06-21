export interface GatsbyActivityTimer {
  start: () => void;
  setStatus: (statusText: string) => void;
  panicOnBuild: (errorMeta: any, error: Error) => void;
  panic: (errorMeta: any, error: Error) => void;
  end: () => void;
}

export interface GatsbyReporterProgressBar {
  total: number;
  start: () => void;
  tick: () => void;
  done: () => void;
}

export interface GatsbyReporter {
  info: (arg: string) => void;
  verbose: (arg: string) => void;
  warn: (arg: string) => void;
  error: (arg: string, error?: Error) => void;
  panic: (arg: string, error?: Error) => void;
  activityTimer: (arg: string) => GatsbyActivityTimer;
  createProgress: (arg: string, total: number) => GatsbyReporterProgressBar;
}

export interface GatsbyOnPreInitProps {
  reporter: GatsbyReporter;
}
