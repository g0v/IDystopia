/**
 * Design Doc: https://g0v.hackmd.io/4HiKmrEASa-YdQ2bqg4kHg
 */

/**
 * <mission-id>:  # repeated
 *   title: <mission-title>
 *   description: <...>
 *   depend:
 *     - "<mission-id>:<step-id>"  # repeated
 *   first_step: <step-id>
 *   steps:
 *     ...
 */
class Mission {
  constructor(id, title, description, depend, firstStep) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.depend = depend;
    this.firstStep = firstStep;
    this.steps = {};
  }

  addStep(missionStep) {
    this.steps[missionStep.id] = missionStep;
  }

  static fromDict(missionId, dict) {
    const title = dict['title'] || 'Unnamed Mission';
    const description = dict['description'] || 'no description';
    const depend = (dict['depend'] || []).filter(d => {
      if (typeof(d) === 'string' || d instanceof String) {
        return true;
      }
      console.warn(`${d} is not a string`);
      return false;
    });

    const mission = new Mission(missionId, title, description, depend, null);

    for (const stepId in dict['steps']) {
      const step = MissionStep.fromDict(stepId, dict['steps'][stepId]);
      mission.addStep(step);
    }
    return mission;
  }
}

const EOD = '$EOD';
const PLAYER = '$player';

/**
 * <step-id>:  # repeated
 *   title: <step-title>
 *   description: <...>
 *   nextStep: <step-id>  # the default next step
 *   npcId: <npc-id>  # whom to find to trigger the dialog of this step.
 *                    # NPC can be an object (e.g. a box).
 *   dialog:
 *     - name: "NPC name" or $player  # who is talking
 *       line: "hello, $player"
 *       id: <line-id>  # optional
 *       nextLine: <line-id>  # optional: jump to another dialog if we don't
 *                             # want to fallthrough.  "$EOD" means "end of
 *                             # dialog"
 *     - name: "NPC name" or $player
 *       question: "Red pill or blue pill?"
 *       choices:
 *         - text: "Red"
 *           nextLine: <line-id>  # optional
 *         - text: "Blue"
 *           nextLine: <line-id>  # optional
 */
class MissionStep {
  constructor(id, title, description, nextStep, npcId, dialog) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.nextStep = nextStep;
    this.npcId = npcId;
    this.dialog = dialog;
  }

  static fromDict(stepId, dict) {
    const title = dict['title'] || 'Unnamed Step';
    const description = dict['description'] || 'no description';
    const nextStep = dict['nextStep'];
    const npcId = dict['npcId'];
    if (npcId === undefined) {
      throw 'npcId must be defined';
    }
    const dialog = Dialog.fromDict(dict['dialog'] || []);
    return new MissionStep(
      stepId, title, description, nextStep, npcId, dialog);
  }
}

/**
 *   dialog:
 *     - name: "NPC name" or $player  # who is talking
 *       line: "hello, $player"
 *       id: <line-id>  # optional
 *       nextLine: <line-id>  # optional: jump to another dialog if we don't
 *                             # want to fallthrough.  "$EOD" means "end of
 *                             # dialog"
 *     - name: "NPC name" or $player
 *       question: "Red pill or blue pill?"
 *       choices:
 *         - text: "Red"
 *           nextLine: <line-id>  # optional
 *         - text: "Blue"
 *           nextLine: <line-id>  # optional
 */
class Dialog {
  constructor() {
    this.dialogItems = [];
    this.dialogIdMap = {};
  }

  addDialogItem(dialogItem) {
    this.dialogItems.push(dialogItem);
    if (dialogItem.id !== undefined) {
      this.dialogIdMap[dialogItem.id] = this.dialogItems.length - 1;
    }
  }

  getIterator() {
    return new DialogIterator(this);
  }

  static fromDict(list) {
    const dialog = new Dialog();
    for (const dict of list) {
      const dialogItem = DialogItem.fromDict(dict);
      dialog.addDialogItem(dialogItem);
    }
    return dialog;
  }
}

class DialogIterator {
  constructor(dialog) {
    this.dialog = dialog;
    this.currentIndex = 0;
  }

  getCurrentDialogItem() {
    return this.dialog.dialogItems[this.currentIndex];
  }

  nextDialogItem(selectedIndex=undefined) {
    const dialogItem = this.dialog.dialogItems[this.currentIndex];
    let nextIndex = this.currentIndex + 1;
    if (dialogItem.nextLine !== undefined) {
      nextIndex = this.dialog.dialogIdMap[dialogItem.nextLine];
    }

    if (dialogItem.choices !== undefined) {
      if (selectedIndex !== undefined) {
        console.warn('This is a multiple choice question, but no selected ' +
                     'answer. Default to the first answer.')
        selectedIndex = 0;
      }

      if (dialogItem.choices[selectedIndex].nextLine !== undefined) {
        nextIndex = dialogItem.choices[selectedIndex].nextLine;
      }
    }

    console.info(`The next line is: ${nextIndex}`);
    this.currentIndex = nextIndex;
    return this.getCurrentDialogItem();
  }
}

/**
 *     - name: "NPC name" or $player  # who is talking
 *       line: "hello, $player"
 *       id: <line-id>  # optional
 *       nextLine: <line-id>  # optional: jump to another dialog if we don't
 *                             # want to fallthrough.  "$EOD" means "end of
 *                             # dialog"
 *     - name: "NPC name" or $player
 *       question: "Red pill or blue pill?"
 *       choices:
 *         - text: "Red"
 *           nextLine: <line-id>  # optional
 *         - text: "Blue"
 *           nextLine: <line-id>  # optional
 */
class DialogItem {
  constructor(name, {
    id: id,
    nextLine: nextLine,
    line: line,
    question: question,
    choices: choices}) {

    if (line !== undefined && question !== undefined) {
      console.warn('`line` and `question` should be mutually exclusive.');
      question = undefined;
    }

    if (line === undefined && question === undefined) {
      console.warn('One of `line` and `question` should be defined.');
      line = '...';
    }

    if (question !== undefined && (choices === undefined || !choices)) {
      console.warn('`question` is defined, but `choices` is not.');
      choices = [
        {text: 'Ok'}
      ]
    }

    this.name = name;  // Who is talking.
    // Optional fields
    this.id = id;
    this.nextLine = nextLine;
    if (line !== undefined) {
      this.line = line;
    } else {  // question should be defined.
      this.question = question;
      this.choices = choices;
    }
  }

  static fromDict(dict) {
    const name = dict['name'] || 'John Doe';
    const id = dict['id'];
    const line = dict['line'];
    const nextLine = dict['nextLine'];
    const question = dict['question'];
    const choices = dict['choices'];

    return new DialogItem(name, {id, line, nextLine, question, choices});
  }
}

export async function loadStoryLine(fileName) {
  const response = await fetch(`/story-lines/${fileName}`);
  const obj = await response.json();

  const missions = obj['missions'];
  const loadedMissions = [];
  if (!missions) {
    return loadedMissions;
  }

  for (const missionId in missions) {
    const missionDict = missions[missionId];
    loadedMissions.push(Mission.fromDict(missionId, missionDict));
  }
  console.log(loadedMissions);
  return loadedMissions;
}
