import React from 'react';
import ReactDOM from 'react-dom';
import ReactBEM from './ReactBEM';
import FormField from './FormField';
import NavigationBar from './NavigationBar';

import clone from './utils/clone';
import globals from './utils/globals';
import throttle from './utils/throttle';
import scrollSlide from './utils/scrollSlide';
import AnimationManager from './utils/AnimationManager';
import SubmitButton from './input_types/SubmitButton';
import assert from 'fl-assert';

// Takes care of the UI part of things.
export default class FormUI extends ReactBEM {
  constructor(...args) {
    super(...args);

    // private
    this.onWheel = this.onWheel.bind(this);
    this.onScroll = throttle(this.onScroll.bind(this), 250, this, true);
    this.touchEnd = this.touchEnd.bind(this);
    this.touchMove = this.touchMove.bind(this);
    this.touchStart = this.touchStart.bind(this);
    this.getFieldNode = this.getFieldNode.bind(this);
    this.getFormFields = this.getFormFields.bind(this);
    this.setFieldActive = this.setFieldActive.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.getActiveFieldKey = this.getActiveFieldKey.bind(this);
    this.slideFieldToCenter = this.slideFieldToCenter.bind(this);
    this.processTouchDisplacement = this.processTouchDisplacement.bind(this);

    // public
    this.focus = this.focus.bind(this);
    this.setQuestionCompleted = this.setQuestionCompleted.bind(this);
    this.goToField = throttle(this.goToField.bind(this), 250, this, false);

    // instance globals
    this.initialTouchY = null;
    this.animatingScroll = false;
    this.animations = new AnimationManager();

    this.appControl = this.props.appControl;
    this.appControl.focus = this.focus;
    this.appControl.goToField = this.goToField;
    this.appControl.setQuestionCompleted = this.setQuestionCompleted;
    this.appControl.setFieldActive = this.setFieldActive;

    this.state = this.generateInitialState(this.props.config);
  }

  /**
   * Processes a config object from this.props and returns it.
   * @private
   * @method importConfig
   * @return {Object}
   */
  generateInitialState() {
    const createUiObj = (objKey) => {
      return { key: objKey, active: false, complete: false };
    };

    // Create a ui object to control questions
    const ui = {};
    ui.submitButton = createUiObj('submit');
    ui.questions = this.props.config.questions.map(q => createUiObj(q.key));
    return { ui };
  }

  /**
   * Called once when the component is created.
   * @private
   * @method componentDidMount
   * @return {void}
   */
  componentDidMount() {
    // Make first question active.
    this.animations.schedule(() => this.goToField('next'), '', 30);


    const centerActiveQuestion = () => {
      const active = this.getActiveFieldKey();
      this.slideFieldToCenter(active);
    };

    window.addEventListener(
      'resize',
      () => this.animations.schedule(centerActiveQuestion, 'formResize', 20)
    );
  }

  /**
   * Returns an array containing all form questions and the submit button.
   * @method getFormFields
   * @return {Array}
   */
  getFormFields() {
    const formFields = [
      ... this.state.ui.questions,
      this.state.ui.submitButton,
    ];
    return formFields;
  }

  /**
   * @private
   * @return {String}
   */
  getActiveFieldKey() {
    const formFields = this.getFormFields();
    const active = formFields.find(f => f.active === true);
    return active ? active.key : undefined;
  }

  /**
   * @private
   * @method getFieldNode
   * @param  {String} key
   * @return {HTMLElement}
   */
  getFieldNode(key) {
    return ReactDOM.findDOMNode(this.refs[key]);
  }

  /**
   * element.focus() but with some extras
   * Focuses and prevent viewBox from scrolling
   * @public
   * @method focus
   * @param  {HTMLElement} element
   * @return {void}
   */
  focus(element) {
    if (!element) { return; }
    const currScrollPosition = this.refs.questionsViewBox.scrollTop;
    const focus = () => {
      element.focus();
      this.refs.questionsViewBox.scrollTop = currScrollPosition;
    };

    setTimeout(focus, 10);
  }


  /**
   * @public
   * Moves the focus to the next or previous question by
   * setting it as active and moving it to the center of the viewport.
   * @method goToField
   * @param  {String} prevNext
   * @return {void}
   */
  goToField(prevNext) {
    const next = prevNext === 'next';
    const formFields = this.getFormFields();
    const activeKey = this.getActiveFieldKey();
    const activeIndex = formFields.findIndex(f => f.key === activeKey);
    const changedIndex = activeIndex + (next ? +1 : -1);
    const newActiveIndex = Math.max(0, Math.min(formFields.length - 1, changedIndex));
    const newActiveKey = formFields[newActiveIndex].key;
    this.setFieldActive(newActiveKey);
    this.slideFieldToCenter(newActiveKey).then(() => {
      const node = this.getFieldNode(newActiveKey);
      this.focus(node.querySelector(`.${globals.FOCUS_CLASS}`));
    });
  }

  /**
   * @private
   */
  async slideFieldToCenter(key) {
    this.animatingScroll = true;
    const node = this.getFieldNode(key);
    assert(node, `No field found with key: ${key}`);
    const viewBox = this.refs.questionsViewBox;

    const viewBoxheight = viewBox.clientHeight;
    const distanceFromTop = Math.max(0, (viewBoxheight - node.clientHeight) / 2);

    const targetScroll = node.offsetTop - distanceFromTop;
    const animationDuration = 300;

    try {
      await scrollSlide(viewBox, targetScroll, animationDuration);
      const focusEl = node.querySelector(`.${globals.FOCUS_CLASS}`);
      if (focusEl) {
        // this.focus(focusEl);
      }
    } catch (e) {
      // nothing
    } finally {
      this.animatingScroll = false;
    }
  }

  // ==============================================================
  //                     STATE HANDLERS
  // ==============================================================

  /**
   * Sets a question as completed.
   * @private
   * @method setQuestionCompleted
   * @param  {String} questionKey
   * @param  {Boolean} completed
   * @return {Promise}
   */
  setQuestionCompleted(questionKey, completed) {
    const qIndex = this.state.ui.questions.findIndex(q => q.key === questionKey);
    assert(qIndex !== -1, `Did not find question with key: ${questionKey}`);

    const ui = clone(this.state.ui);
    ui.questions[qIndex].completed = !!completed;

    return new Promise(resolve => this.setState({ ui }, resolve));
  }

  /**
   * @private
   * @method setFieldActive
   * @param  {String} index
   */
  setFieldActive(key) {
    assert(this.refs[key], `Invalid key: ${key}`);
    const ui = clone(this.state.ui);

    // set everyone not active
    ui.submitButton.active = false;
    for (const q of ui.questions) {
      q.active = false;
    }

    if (key === ui.submitButton.key) {
      ui.submitButton.active = true;
    } else {
      const questionIndex = ui.questions.findIndex(q => q.key === key);
      assert(questionIndex !== -1, `Invalid question index ${questionIndex}`);
      ui.questions[questionIndex].active = true;
    }

    this.setState({ ui });
  }

  // ==============================================================
  //                     EVENT HANDLERS
  // ==============================================================
  /**
   * Scroll envent on questionsViewBox
   * @param  {Event} e
   */
  onScroll() {
    if (this.animatingScroll) {
      return;
    }

    const formFields = this.getFormFields();
    const formNodes = formFields.map(f => this.getFieldNode(f.key));
    const viewBoxHeight = this.refs.questionsViewBox.clientHeight;
    const viewBoxScroll = this.refs.questionsViewBox.scrollTop;
    const viewBoxCenter = viewBoxScroll + viewBoxHeight / 2;

    function distanceFromCenter(element) {
      const elementCenter = element.clientHeight / 2 + element.offsetTop;
      const elementDistance = viewBoxCenter - elementCenter;
      const distance = Math.abs(elementDistance);
      return distance;
    }

    let smallestDistance = distanceFromCenter(formNodes[0]);
    const indexOfCenterNode = formNodes.reduce((closestIdx, node, nodeIdx) => {
      const nodeDistance = distanceFromCenter(formNodes[nodeIdx]);
      const closestNodeIndex = nodeDistance < smallestDistance ? nodeIdx : closestIdx;
      smallestDistance = nodeDistance < smallestDistance ? nodeDistance : smallestDistance;
      return closestNodeIndex;
    }, 0);

    const closestKey = formFields[indexOfCenterNode].key;
    this.setFieldActive(closestKey);
  }

  /**
   * Wheel envent on questionsViewBox
   * @param  {Event} e
   */
  onWheel(e) {
    e.preventDefault();
    const wheelDelta = e.nativeEvent.wheelDelta;
    this.animations.schedule(() => {
      if (wheelDelta < 0) {
        this.goToField('next');
      } else if (wheelDelta > 0) {
        this.goToField('prev');
      }
    }, 'scroll', 3);
  }

  /**
   * Touch envent on questionsViewBox
   * @param  {Event} e
   */
  touchStart(e) {
    this.initialTouchY = e.changedTouches[0].pageY;
    this.trackingTouch = true;
  }

  /**
   * Touch envent on questionsViewBox
   * @param  {Event} e
   */
  touchMove(e) {
    e.preventDefault(); // Prevent scroll on mobile
    this.processTouchDisplacement(e);
  }

  /**
   * Touch envent on questionsViewBox
   * @param  {Event} e
   */
  touchEnd(e) {
    this.processTouchDisplacement(e);
  }

  /**
   * @param  {Event} e
   * @return {void}
   */
  processTouchDisplacement(e) {
    if (!this.trackingTouch) {
      return;
    }

    const currTouchY = e.changedTouches[0].pageY;
    const displacement = currTouchY - this.initialTouchY;
    const minTouchDisplacement = 80;
    if (Math.abs(displacement) < minTouchDisplacement) {
      return;
    }

    this.trackingTouch = false;
    if (displacement < 0) {
      this.goToField('next');
    } else {
      this.goToField('prev');
    }
  }

  render() {
    const questions = this.props.config.questions.map((q, index) => {
      return (
        <FormField
          config={q}
          ui={this.state.ui.questions[index]}
          appControl={this.appControl}
          key={q.key}
          ref={q.key}
        />);
    });

    return (
      <div className={this.bemClass}>
        <div
          className={this.bemSubComponent('questionsViewBox')}
          ref="questionsViewBox"
          onTouchStart={this.touchStart}
          onTouchEnd={this.touchEnd}
          onTouchMove={this.touchMove}
          onWheel={this.onWheel}
          onScroll={this.onScroll}
        >
          <div className={this.bemSubComponent('questions')} ref="questions" >
            {questions}

            <SubmitButton
              ui={this.state.ui.submitButton}
              appControl={this.appControl}
              ref={this.state.ui.submitButton.key}
            />
          </div>
        </div>

        <NavigationBar appControl={this.appControl} ui={this.state.ui} />
      </div>
    );
  }
}

FormUI.PropTypes = {
  config: React.PropTypes.object.isRequired,
  appControl: React.PropTypes.object.isRequired,
};
