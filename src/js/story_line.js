/**
 * Design Doc: https://g0v.hackmd.io/4HiKmrEASa-YdQ2bqg4kHg
 */

import * as DataStore from './data_store.js';

/**
 * <mission-id>:  # repeated
 *   title: <mission-title>
 *   description: <...>
 *   depend:
 *     - "<mission-id>:<step-id>"  # repeated
 *   firstStep: <step-id>
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

  isReady() {
    console.log(`checking dependency of ${this.id}`);
    if (!this.depend) return true;
    for (const idx in this.depend) {
      const d = this.depend[idx];
      console.log(`condition: `, d);
      let key;
      let expectedValue;
      if (typeof(d) === 'string') {
        key = d;
      } else if (typeof(d) === 'object') {
        key = d['storeKey'];
        expectedValue = d['value'];
      }
      if (!DataStore.AnswerStore.has(key)) return false;
      if (!expectedValue) continue;
      const actualValue = DataStore.AnswerStore.get(key);
      if (actualValue !== expectedValue) return false;
    }
    console.log(`${this.id} is ready!`);
    return true;
  }

  static fromDict(missionId, dict) {
    const title = dict['title'] || 'Unnamed Mission';
    const description = dict['description'] || 'no description';
    const firstStep = dict['firstStep'] || 'step-1';
    const depend = (dict['depend'] || []).filter(d => {
      if (typeof(d) === 'string' || d instanceof String) {
        return true;
      }
      if (typeof(d) === 'object') return true;
      console.warn(`${d} is not a string nor an object`);
      return false;
    });

    const mission = new Mission(missionId, title, description, depend, firstStep);

    for (const stepId in dict['steps']) {
      const step = MissionStep.fromDict(stepId, dict['steps'][stepId], mission);
      mission.addStep(step);
    }
    return mission;
  }
}

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
  constructor({id, title, description, nextStep, npcId, dialog, mission, moveTo}) {
    this.id = id;
    this.title = title || 'Unnamed Step';
    this.description = description || '...';
    this.nextStep = nextStep;
    this.npcId = npcId;
    this.dialog = dialog;
    this.mission = mission;
    this.moveTo = moveTo;
  }

  static fromDict(stepId, dict, mission) {
    //const title = dict['title'] || 'Unnamed Step';
    //const description = dict['description'] || 'no description';
    //const nextStep = dict['nextStep'];
    //const npcId = dict['npcId'];
    //if (npcId === undefined) {
      //throw 'npcId must be defined';
    //}
    const d = {id: stepId, mission: mission, ...dict};
    const missionStep = new MissionStep(d);

    const dialog = Dialog.fromDict(dict['dialog'] || [], missionStep);
    missionStep.dialog = dialog;
    return missionStep;
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
  constructor(missionStep) {
    this.missionStep = missionStep;
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
    return new DialogIterator(this, this.missionStep.nextStep);
  }

  static fromDict(list, missionStep) {
    const dialog = new Dialog(missionStep);
    for (const dict of list) {
      const dialogItem = DialogItem.fromDict(dict);
      dialog.addDialogItem(dialogItem);
    }
    return dialog;
  }
}


class DialogIterator {
  constructor(dialog, nextStep) {
    this.dialog = dialog;
    this.currentIndex = 0;
    this.nextStep = nextStep;
  }

  getCurrentDialogItem() {
    const item = this.dialog.dialogItems[this.currentIndex];
    if (item && item.nextStep) this.nextStep = item.nextStep;
    return item;
  }

  nextDialogItem(answer=undefined) {
    const dialogItem = this.dialog.dialogItems[this.currentIndex];
    let nextIndex = this.currentIndex + 1;
    if (dialogItem.nextLine !== undefined) {
      nextIndex = this.dialog.dialogIdMap[dialogItem.nextLine];
    }

    if (dialogItem instanceof DialogItemSelect) {
      if (answer === undefined) {
        console.warn('This is a multiple choice question, but no selected ' +
          'answer. Default to the first answer.')
        answer = 0;
      }

      if (dialogItem.choices[answer].nextLine !== undefined) {
        const nextLine = dialogItem.choices[answer].nextLine;
        nextIndex = this.dialog.dialogIdMap[nextLine];
      }
    }

    if (dialogItem instanceof DialogItemPrompt) {
      if (dialogItem.storeKey) {
        DataStore.AnswerStore.setAndNotify(dialogItem.storeKey, answer);
      }
    }
    if (dialogItem instanceof DialogItemSelect) {
      const value = dialogItem.choices[answer].value || answer;
      if (dialogItem.storeKey) {
        DataStore.AnswerStore.setAndNotify(dialogItem.storeKey, value);
        DataStore.RemoteStore.increase(`USER_RESPONSE/${dialogItem.storeKey}`);
      }
    }

    console.info(`${this.dialog.missionStep.id} The next line is: ${nextIndex}`);
    this.currentIndex = nextIndex;
    return this.getCurrentDialogItem();
  }
}

/**
 * Properties:
 *   - id: (optional) an id to find this line.
 *   - name: Who is talking, can be "$player"
 *   - nextLine: (optional) jump to another dialog if we don't want to fallthrough.
 *               use "$EOD" to end the dialog.
 */
class DialogItem {
  constructor(name, {id: id, nextLine: nextLine}) {
    this.name = name;
    this.id = id;
    this.nextLine = nextLine;
  }

  static fromDict(dict) {
    const name = dict['name'] || 'John Doe';
    const type = dict['type'] || 'line';

    switch (type) {
      case 'line':
        return new DialogItemLine(name, dict);
      case 'input.select':
        return new DialogItemSelect(name, dict);
      case 'input.text':
        return new DialogItemPrompt(name, dict);
      case 'message':
        return new DialogItemMessage(name, dict);
      case 'iframe':
        return new DialogItemIframe(name, dict);
      default:
        console.warn('unkonwn dialog type: %s', type);
        return new DialogItemLine(name, dict);
    }
  }
}

/**
 * Dialog item for a single line
 *     - name: "NPC name" or $player  # who is talking
 *       line: "hello, $player"
 *       id: <line-id>  # optional
 *       nextLine: <line-id>  # optional: jump to another dialog if we don't
 *                             # want to fallthrough.  "$EOD" means "end of
 *                             # dialog"
 */
export class DialogItemLine extends DialogItem {
  constructor(name, {
    id: id,
    nextLine: nextLine,
    line: line, }) {
    super(name, {id, nextLine});

    if (line === undefined) {
      console.warn('One of `line` and `question` should be defined.');
      line = '...';
    }
    this.line = line;
  }

}

/**
 *     - name: "NPC name" or $player
 *       question: "Red pill or blue pill?"
 *       storeKey: 'key'  (optional) to save the answer in localStore.
 *       choices:
 *         - text: "Red"
 *           nextLine: <line-id>  # optional
 *         - text: "Blue"
 *           nextLine: <line-id>  # optional
 */
export class DialogItemSelect extends DialogItem {
  constructor(name, {
    id: id,
    nextLine: nextLine,
    question: question,
    choices: choices,
    storeKey: storeKey}) {

    super(name, {id, nextLine});
    if (question === undefined) {
      console.warn('set default question');
      question = 'Please select an answer.';
    }
    this.question = question;

    if (choices === undefined || !choices) {
      console.warn('set default choices');
      choices = [
        {text: 'Ok'}
      ]
    }
    this.choices = choices;
    this.storeKey = storeKey;
  }
}

/**
 * Dialog item for an open question
 *
 *     - name: "NPC name" or $player
 *       question: "What's your name?"
 *       storeKey: 'key' (optional) to save the answer in localStore
 *
 */
export class DialogItemPrompt extends DialogItem {
  constructor(name, {
    id: id,
    nextLine: nextLine,
    question: question,
    storeKey: storeKey, }) {
    super(name, {id, nextLine});
    if (question === undefined) {
      console.warn('set deafult question');
      question = 'What do you want to share?';
    }
    this.question = question;
    this.storeKey = storeKey;
  }
}

export class DialogItemMessage extends DialogItem {
  constructor(name, {
    id: id,
    nextLine: nextLine,
    message: message}) {
    super(name, {id, nextLine});
    if (message === undefined) {
      console.warn('use default message');
      message = 'MESSAGE';
    }
    this.message = message;
  }
}

export class DialogItemIframe extends DialogItem {
  constructor(name, {
    id: id,
    nextLine: nextLine,
    url: url,
    callback: callback,
    style: style,}) {
    super(name, {id, nextLine});

    this.url = url;
    this.callback = callback;
    this.style = style;
  }
}

export function loadStoryLineFromObject(obj) {
  const missions = obj['missions'];
  const loadedMissions = {};
  if (!missions) {
    return loadedMissions;
  }

  for (const missionId in missions) {
    const missionDict = missions[missionId];
    loadedMissions[missionId] = Mission.fromDict(missionId, missionDict);
  }
  console.debug(loadedMissions);
  return loadedMissions;
}

export async function loadStoryLine(fileName) {
  const response = await fetch(`/story-lines/${fileName}`);
  const obj = await response.json();

  return loadStoryLineFromObject(obj);
}
