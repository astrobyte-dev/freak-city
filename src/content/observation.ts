import type { NPCId } from "../engine/types";
export const patientDetails: Record<NPCId, string[]> = {
  mara: [
    "Mara checks the counter before setting down anything breakable.",
    "Mara photographs the chipped glasses before moving them aside. The marks are for a supplier, not decoration.",
    "After several minutes, you see the pattern: Mara finishes the task nearest another person's hands before starting her own. It is work, not a promise about you.",
  ],
  celeste: [
    "Celeste holds the page still while someone else is speaking.",
    "She moves an unfinished dinner out of the paperwork's way, then forgets it again.",
    "You watch her separate a note from the page it was clipped to. A question and an authorisation are being kept apart. You cannot read either from here.",
  ],
  luca: [
    "Luca straightens the same stretch of cable twice.",
    "He pauses before forwarding a message, rereads it and leaves it unsent.",
    "After five minutes, he asks someone whether their words were meant for the group. You hear the request for permission, not the private answer.",
  ],
  inez: [
    "Inez checks the place where the last person stood before looking for what they lost.",
    "She checks an entry against a second page rather than trusting her memory.",
    "You see her cross out a certainty and write a question. She leaves the correction visible. It doesn't prove anything about the invitation.",
  ],
};
export const overheardWork: Record<string, string> = {
  bar: "From the service hatch: a question about clean cups, an answer about the crooked shelf. They know which problem the other person means.",
  kitchen:
    "Two people compare the stock count through the hatch. Neither shares the private reason someone missed a shift.",
  stage:
    "A short discussion about labelling the spare keys ends with agreement to leave UNKNOWN on the uncertain one.",
  office:
    "Paper shifts. Someone checks a time aloud, then corrects it. You can't see the underlying document.",
  vestibule:
    "A quiet question about lost property. Inez, when she's here, keeps names below the level of the general conversation.",
};

export const observationRooms: Record<NPCId, string[]> = {
  mara: ["bar", "kitchen"],
  celeste: ["office", "salon", "exchange-room"],
  luca: ["stage"],
  inez: ["vestibule"],
};
export const listeningDetails: Record<NPCId, string[]> = {
  mara: [
    "Give me a moment to finish this.",
    "I can do one thing at a time. It usually works better that way.",
    "Ask me when there's a pause. I don't want to pretend I heard you.",
  ],
  celeste: [
    "One moment. I'm listening.",
    "Let's keep the question separate from the decision.",
    "An answer can wait until we've made the question clear.",
  ],
  luca: [
    "Hang on. Let me get this right.",
    "I should check before I tell anyone else that.",
    "Was that meant for the group, or just for me?",
  ],
  inez: [
    "A moment. I'll check.",
    "I would rather look twice than send you the wrong way once.",
    "You can correct the entry. That's what the space beside it is for.",
  ],
};
