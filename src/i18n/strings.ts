import type { Lang } from '../domain/types';

const en = {
  appName: 'Kinfolk Check NG',
  ob1Title: 'One kit. Three results.',
  ob1Body: 'Test your genotype, blood group and malaria at home in about 10 minutes.',
  ob2Title: 'Your data stays on your phone',
  ob2Body: 'No account. Nothing is uploaded. You can delete everything any time.',
  ob3Title: 'A screening, not a diagnosis',
  ob3Body:
    'Kinfolk Check NG helps you screen at home. It does not replace a doctor or laboratory. Serious results must be confirmed at a lab.',
  accept: 'I understand, continue',
  next: 'Next',
  startTest: 'Start a test',
  checkCompat: 'Check compatibility',
  history: 'History',
  settings: 'Settings',
  assisted: 'Assisted reading',
  assistedNote: 'The app suggests what it sees. You confirm what is on your kit.',
  timerNote: 'Timer is per kit instructions — we will confirm exact wait time once we have the real kit.',
  findLab: 'Find a lab near me',
  seeDoctor: 'See a doctor / confirm at a lab',
  ackLab: 'I understand I must confirm this result at a lab.',
  qrTrustNote: 'Only show this QR to someone you trust.',
  language: 'Language',
  deleteAll: 'Delete all my data',
  areYouSure: 'Are you sure?',
  deleteWarn: 'This permanently deletes all your results and kit photos from this phone. This cannot be undone.',
  yesDelete: 'Yes, delete everything',
  cancel: 'Cancel',
  noResults: 'No results yet.',
} as const;

export type StringKey = keyof typeof en;

const pcm: Record<StringKey, string> = {
  appName: 'Kinfolk Check NG',
  ob1Title: 'One kit. Three results.',
  ob1Body: 'Test your genotype, blood group and malaria for house for like 10 minutes.',
  ob2Title: 'Your data dey stay for your phone',
  ob2Body: 'No account. We no dey upload anything. You fit delete everything anytime.',
  ob3Title: 'Na screening, no be diagnosis',
  ob3Body:
    'Kinfolk Check NG dey help you screen for house. E no replace doctor or lab. Serious result must go lab for confirmation.',
  accept: 'I don understand, continue',
  next: 'Next',
  startTest: 'Start test',
  checkCompat: 'Check compatibility',
  history: 'History',
  settings: 'Settings',
  assisted: 'Assisted reading',
  assistedNote: 'Di app go suggest wetin e see. You go confirm wetin dey your kit.',
  timerNote: 'Timer na per kit instructions — we go confirm di exact wait time when we get di real kit.',
  findLab: 'Find lab near me',
  seeDoctor: 'See doctor / confirm for lab',
  ackLab: 'I understand say I must confirm dis result for lab.',
  qrTrustNote: 'Only show dis QR to person wey you trust.',
  language: 'Language',
  deleteAll: 'Delete all my data',
  areYouSure: 'You sure?',
  deleteWarn: 'Dis one go delete all your results and kit photos for dis phone forever. E no fit come back.',
  yesDelete: 'Yes, delete everything',
  cancel: 'Cancel',
  noResults: 'No result yet.',
};

export const strings: Record<Lang, Record<StringKey, string>> = { en, pcm };
