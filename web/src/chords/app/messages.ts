import { UiSchema } from '@effect/ui'
import { Schema } from 'effect'
import { MoveStatus, PracticeMode, Search, Sheet, Tab } from './state'

/** A change to the URL's search, from a control. The shape index resets unless the change sets it. */
export const SearchPatch = Schema.Struct({
  key: Schema.optionalKey(Search.fields.key),
  scale: Schema.optionalKey(Search.fields.scale),
  layout: Schema.optionalKey(Search.fields.layout),
  base: Schema.optionalKey(Search.fields.base),
  root: Schema.optionalKey(Search.fields.root),
  chord: Schema.optionalKey(Search.fields.chord),
  v: Schema.optionalKey(Search.fields.v),
  sevenths: Schema.optionalKey(Search.fields.sevenths),
  all: Schema.optionalKey(Search.fields.all),
})
export type SearchPatch = typeof SearchPatch.Type

export const ChordsMessage = UiSchema.TaggedEnum({
  // Controls.
  PickedView: { patch: SearchPatch },
  ClickedTutorial: { id: Schema.String, step: Schema.Number },
  ClickedNextStep: {},
  ClickedExitTutorial: {},
  ClickedSong: { id: Schema.String, pos: Schema.Number },
  ClickedExitSong: {},
  ClickedDeleteSong: { id: Schema.String },
  ClickedExercise: { id: Schema.NullOr(Schema.String) },
  SelectedTab: { tab: Tab },
  ClickedBrowse: {},
  ClickedConnect: {},
  ClickedSignIn: {},
  ClickedThemeToggle: {},
  ToggledSustain: {},
  ClickedPlayChord: {},
  ClickedPad: { midi: Schema.Number },
  /** `x` is the pointer's distance from the resize handle's left edge. */
  GrabbedSidebar: { x: Schema.Number },
  DraggedSidebar: { x: Schema.Number },
  ReleasedSidebar: {},
  PressedSidebarKey: { key: Schema.String },
  DoubleClickedSidebar: {},
  // What this browser keeps: pasted songs, the sidebar width, and a sheet the Ultimate Guitar bookmarklet sent.
  CompletedReadStorage: {
    sheets: Schema.Array(Sheet),
    sidebar: Schema.Number,
    imported: Schema.NullOr(Sheet),
  },

  // Move.
  ChangedMoveStatus: { status: MoveStatus },
  PressedPad: { col: Schema.Number, row: Schema.Number, velocity: Schema.Number, time: Schema.Number },
  ReleasedPad: { col: Schema.Number, row: Schema.Number },
  PressedButton: { cc: Schema.Number },
  ReleasedButton: { cc: Schema.Number },
  TickedCue: {},

  // Practice.
  ClickedStartPractice: {},
  ClickedStopPractice: {},
  PickedPracticeMode: { mode: PracticeMode },
  PickedPracticeSpeed: { speed: Schema.Number },
  ToggledPracticeLoop: {},
  CompletedReadPracticeClock: { now: Schema.Number, audioNow: Schema.Number, latency: Schema.Number },
  TickedPractice: { now: Schema.Number, audioNow: Schema.Number },

  // The account's copy of the pasted songs.
  ChangedUser: { userId: Schema.NullOr(Schema.String) },
  SucceededJoinAccount: { userId: Schema.String, merged: Schema.Array(Sheet) },
  SucceededSaveAccount: { json: Schema.String },
  ConflictedSaveAccount: { merged: Schema.Array(Sheet) },
  FailedAccount: { what: Schema.String },
  RetriedAccount: {},
  ChangedVisibility: { visible: Schema.Boolean },
  RefreshedAccount: { sheets: Schema.NullOr(Schema.Array(Sheet)) },
})
export type ChordsMessage = typeof ChordsMessage.Type
