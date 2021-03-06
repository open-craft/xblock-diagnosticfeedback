function Quiz(runtime, element, initData) {
    // contain js related to studio quiz wizard
    // import related js helpers
    var customValidator = new CustomValidator(runtime, element, initData),
        common = new Common(runtime, element, initData),
        studioCommon = new StudioCommon(runtime, element, initData),
        setting = new Setting(runtime, element, initData),
        editQuestionPanel = ".diagnostic-feedback .edit_questionnaire_panel";

    if (typeof gettext === "undefined") {
        window.gettext = function gettext_stub(string) {
            return string;
        };
        window.ngettext = function ngettext_stub(strA, strB, n) {
            return n === 1 ? strA : strB;
        };
    }

    $(function ($) {

        // show quiz wizard html after popup loads its resources
        studioCommon.showQuizForm();

        // selector' to scope elements for the current XBlock instance, to
        // differentiate multiple diagnostic feedback blocks on one page
        var $form = $(".diagnostic-feedback .questionnaire-form", element),
            $step1Panel = $(".diagnostic-feedback section[step='1']", element),

        // child selector' which are either searched in an element already in current XBlock instance scope OR
        // used as combination with some other selector, will be scoped to current XBlock instance (if required)
        // at their usage places

            categoriesPanel = '.diagnostic-feedback .categories_panel',
            addNewCategoryBtn = categoriesPanel + ' .add-new-category',
            addNewGroupBtn = '.add-new-group',
            deleteCategoryBtn = '.delete-category',
            copyCategoryBtn = '.copy-category',
            copyRangeBtn = '.copy-range',
            copyQuestionBtn = '.copy-question',
            categoryDiv = '.category',
            editorTextArea = '.custom-textarea',
            questionTitle = '.question-title',
            questionGroup = '.question-group',
            questionTxt = '.question-txt',
            resultGroup = '.result-group',
            groupError = 'group-error',

            accordion = '.accordion',
            accordionGroup = ".group",
            openAddGroupPanel = '.open-add-grp-panel',
            closeAddGroupPanel = '.close-add-grp-panel',

            rangesPanel = '.ranges_panel',
            addNewRangeBtn = rangesPanel + ' .add-new-range',
            deleteRangeBtn = '.delete-range',
            rangeDiv = '.range',

            step3Panel = ".diagnostic-feedback section[step='3']",
            questionPanel = '.diagnostic-feedback .questions_panel',
            addNewQuestionBtn = '.add-new-question',
            deleteQuestionBtn = '.delete-question',
            questionDiv = '.question',

            addNewChoiceBtn = '.add-new-choice',
            deleteChoiceBtn = '.delete-choice',
            choiceDiv = '.answer-choice',
            toolTip = '.diagnostic-feedback .custom-tooltip',
            closeMsgBtn = '.close_msg',
            accordionHeader = '.ui-accordion-header',
            accordionContent = '.ui-accordion-content',

            categoryNameField = 'input[name*="category[name]"]',
            categoryImageField = 'input[name*="category[image]"]',
            categoryGroupField = 'select[name*="category[group]"]',
            categoryInternalDescField = 'input[name*="category[internal_description]"]',
            categoryHtmlBodyField = 'textarea[name*="category[html_body]"]',

            rangeNameField = 'input[name*="range[name]"]',
            rangeMinField = 'input[name*="range[min]"]',
            rangeMaxField = 'input[name*="range[max]"]',
            rangeImageField = 'input[name*="range[image]"]',
            rangeGroupField = 'select[name*="range[group]"]',
            rangeInternalDescField = 'input[name*="range[internal_description]"]',
            rangeHtmlBodyField = 'textarea[name*="range[html_body]"]',
            choiceValueByClass = '.answer-value',
            choiceResult = '.result-choice',
            choiceNameByClass = '.answer-txt';

        function renderSteps() {
            // render all steps html as XBlock studio view load

            if (initData.quiz_type === "") {
                // when first time studio view opens with no initData
                studioCommon.renderCategories();
                studioCommon.createAccordion(categoriesPanel + " " + accordion, 'categories');

                studioCommon.renderRanges();
                studioCommon.createAccordion(rangesPanel + " " + accordion, 'ranges');
            } else if (initData.quiz_type === initData.BUZZFEED_QUIZ_VALUE) {
                // when editing buzzfeed-style quiz
                studioCommon.renderCategories();
                studioCommon.createAccordion(categoriesPanel + " " + accordion, 'categories');
            } else {
                // when editing dignostic-style quiz
                studioCommon.renderRanges();
                studioCommon.createAccordion(rangesPanel + " " + accordion, 'ranges');
            }
            studioCommon.renderQuestions();
            studioCommon.createAccordion(questionPanel + " " + accordion, 'questions');
        }

        //initialize js validations if on in setting.js
        if (setting.jsValidation) {
            // initialize jQuery validation on form
            $form.validate({
                success: function (label, element) {
                    if ($(element).is("textarea")) {
                        $(element).prev(toolTip).remove();
                    } else {
                        $(element).next(toolTip).remove();
                    }

                    var groups = $(element).parents('.group');
                    if (groups.length > 0) {
                        groups.removeClass(groupError);
                    }
                },
                errorPlacement: function errorPlacement(error, element) {
                    var container = $('<div />');
                    container.addClass('custom-tooltip');

                    if (element.is("textarea")) {
                        error.insertAfter(element.prev());
                    } else {
                        error.insertAfter(element);
                    }

                    var groups = element.parents('.group');
                    if (groups.length > 0) {
                        groups.addClass(groupError);
                    }

                    error.wrap(container);
                    $('<span class="feedback-symbol fa fa-warning"></span>').insertAfter(error);
                }
            });
        }

        function submitForm(currentStep) {
            // Send current step data to server for saving

            currentStep = parseInt(currentStep);
            var answerHandlerUrl = runtime.handlerUrl(element, 'save_data');

            var data = studioCommon.getStepData(currentStep);
            studioCommon.updateNextForm(currentStep, data);

            return $.ajax({
                async: false,
                type: "POST",
                url: answerHandlerUrl,
                data: JSON.stringify(data),
            });
        }

        function submitToSave(currentStep) {
            var success = false;
            $.when(submitForm(currentStep)).done(function (response) {
                //runtime.refreshXBlock(element);
                if (response.success) {
                    success = true;

                    //close modal window if step3 saved successfully
                    if (response.step === 3) {
                        if (showInvalidChoiceValueWarning.showWarning) {
                            common.showMessage({
                                success: false,
                                warning: true,
                                persist: true,
                                msg: '<br />' +
                                gettext('Your data has been successfully saved.') +
                                '<br />' +
                                gettext('However, some answer combinations in "' + showInvalidChoiceValueWarning.warningGroup +
                                    '" may not belong to any result in that group.') +
                                '<a class="close_msg" href="#" style="float: right">' +
                                gettext('Close') +
                                '</a>'
                            });
                            showInvalidChoiceValueWarning.showWarning = false;
                        } else {
                            studioCommon.closeModal(runtime.modal);
                        }
                    }
                }

                if (response.step !== 3 || (response.step === 3 && !response.success)) {
                    common.showMessage(response);
                }
            });
            return success;
        }

        function validateAndSave(event, currentIndex, newIndex) {
            // send validated step data to server, this method will return true/false
            // if return true next stepp will be loaded
            // if return false validation errors will be shown

            // generic validation rules
            var fieldToIgnore = [
                    'section:visible .skip-validation',
                    'section:hidden input',
                    'section:hidden textarea',
                    'section:hidden select'
                ],
                quizType = studioCommon.getQuizType(),
                customValidated = false;

            tinyMCE.triggerSave();

            if (currentIndex > newIndex) {
                // allow to move backwards without validate & save
                return true;
            } else {
                //validate and save data if moving next OR at last step
                var currentStep = currentIndex + 1;

                //execute both server side & js validations if on in setting.js
                if (setting.jsValidation) {
                    //ignore hidden fields; will validate on current step showing fields
                    if (currentStep === 2) {
                        // add step-2 related validation rules
                        if (quizType === initData.BUZZFEED_QUIZ_VALUE) {
                            // in buzzfeed-style quiz ignore diagnostic-style quiz (ranges) related fields
                            fieldToIgnore = fieldToIgnore.concat([
                                'section:visible .ranges_panel input:hidden',
                                'section:visible .ranges_panel select:hidden'
                            ]);
                        } else {
                            // in diagnostic-style quiz ignore buzzfeed-style quiz (categories) related fields
                            fieldToIgnore = fieldToIgnore.concat([
                                'section:visible .categories_panel input:hidden',
                                'section:visible .categories_panel select:hidden'
                            ]);
                        }

                    } else {
                        // add step-3 related validation rules
                        if (quizType === initData.BUZZFEED_QUIZ_VALUE) {
                            // in buzzfeed-style quiz ignore diagnostic-style quiz related fields
                            fieldToIgnore = fieldToIgnore.concat([
                                'section:visible input.answer-value:hidden'
                            ]);
                        } else {
                            // in diagnostic-style quiz ignore buzzfeed-style quiz related fields
                            fieldToIgnore = fieldToIgnore.concat([
                                'section:visible select.result-choice:hidden'
                            ]);
                        }
                    }
                    $form.validate().settings.ignore = fieldToIgnore.join(", ");

                    // run jquery.validate
                    // run extra validations if jquery vlidations are passed
                    var isValid = $form.valid();
                    if (isValid) {
                        customValidated = customValidator.customStepValidation(currentStep);
                    } else {
                        console.log($form.validate().errorList);
                    }

                    if (isValid && customValidated) {
                        //wait for ajax call response
                        return submitToSave(currentStep);
                    } else {
                        return false;
                    }

                } else {
                    // only server side validations will be applied
                    //wait for ajax call response
                    return submitToSave(currentStep);
                }
            }
        }

        // convert steps html to wizard, initial configurations
        $form.children("div").steps({
            headerTag: "h3",
            bodyTag: "section",
            transitionEffect: "slideLeft",
            onStepChanging: validateAndSave,
            onFinishing: validateAndSave,
            labels: {
                cancel: gettext("Cancel"),
                current: gettext("Current Step"),
                finish: gettext("Save"),
                next: gettext("Next"),
                previous: gettext("Previous"),
                loading: gettext("Loading ...")
            }
        });

        $(addNewCategoryBtn, element).click(function (eventObject) {
            // Add new category template to page

            eventObject.preventDefault();
            var link = $(eventObject.currentTarget),
                existingCategories = link.prev().find(accordionGroup).length,
                categoriesPanelObj = $(categoriesPanel, element);

            studioCommon.renderSingleCategory(existingCategories);
            studioCommon.initiateHtmlEditor(categoriesPanelObj);
            studioCommon.refreshAccordion(categoriesPanel + " " + accordion);
            studioCommon.bindSortTitleSource(categoriesPanelObj);
        });

        $(categoriesPanel, element).on('click', copyCategoryBtn, function (eventObject) {
            // copy a category

            eventObject.preventDefault();
            var link = $(eventObject.currentTarget),
                categoriesPanelObj = $(categoriesPanel, element),
                existingCategories = categoriesPanelObj.find(categoryDiv).length,
                currentCategoryContainer = link.parents(accordionHeader).nextAll(accordionContent);

            var category = {
                id: '',
                name: currentCategoryContainer.find(categoryNameField).val(),
                image: currentCategoryContainer.find(categoryImageField).val(),
                group: currentCategoryContainer.find(categoryGroupField).val(),
                internal_description: currentCategoryContainer.find(categoryInternalDescField).val(),
                html_body: currentCategoryContainer.find(categoryHtmlBodyField).val()
            };
            // get rendered html to append right next to copied category
            var html = studioCommon.renderSingleCategory(existingCategories, category, true);
            $(html).insertAfter(currentCategoryContainer.parent());

            //remove all tinymce binding
            studioCommon.destroyAllEditors(categoriesPanelObj);
            studioCommon.refreshAccordion(categoriesPanel + " " + accordion);
            studioCommon.bindSortTitleSource(categoriesPanelObj);
            studioCommon.processCategories(categoriesPanelObj)
        });

        $(addNewRangeBtn, element).click(function (eventObject) {
            // Add new range template to page

            eventObject.preventDefault();
            var link = $(eventObject.currentTarget),
                existingRanges = link.prev().find(accordionGroup).length,
                rangesPanelObj = $(rangesPanel, element);

            studioCommon.renderSingleRange(existingRanges);
            studioCommon.initiateHtmlEditor(rangesPanelObj);
            studioCommon.refreshAccordion(rangesPanel + " " + accordion);
            studioCommon.bindSortTitleSource(rangesPanelObj);
        });

        $(rangesPanel, element).on('click', copyRangeBtn, function (eventObject) {
            // copy a range

            eventObject.preventDefault();
            var link = $(eventObject.currentTarget),
                rangesPanelObj = $(rangesPanel, element),
                existingRanges = rangesPanelObj.find(rangeDiv).length,
                currentRangeContainer = link.parents(accordionHeader).nextAll(accordionContent);

            var _range = {
                name: currentRangeContainer.find(rangeNameField).val(),
                min_value: currentRangeContainer.find(rangeMinField).val(),
                max_value: currentRangeContainer.find(rangeMaxField).val(),
                image: currentRangeContainer.find(rangeImageField).val(),
                group: currentRangeContainer.find(rangeGroupField).val(),
                internal_description: currentRangeContainer.find(rangeInternalDescField).val(),
                html_body: currentRangeContainer.find(rangeHtmlBodyField).val()
            };
            // get rendered html to append right next to copied range
            var html = studioCommon.renderSingleRange(existingRanges, _range, true);
            $(html).insertAfter(currentRangeContainer.parent());

            //remove all tinymce binding
            studioCommon.destroyAllEditors(rangesPanelObj);
            studioCommon.refreshAccordion(rangesPanel + " " + accordion);
            studioCommon.bindSortTitleSource(rangesPanelObj);
            studioCommon.processRanges(rangesPanelObj);
        });

        $(editQuestionPanel, element).on('click', openAddGroupPanel, function (eventObject) {
            eventObject.preventDefault();

            var btn = $(eventObject.currentTarget);
            studioCommon.showAddGroupPanel(btn);
        });

        $(editQuestionPanel, element).on('click', closeAddGroupPanel, function (eventObject) {
            eventObject.preventDefault();

            var btn = $(eventObject.currentTarget);
            studioCommon.hideAddGroupPanel(btn);
        });

        $(editQuestionPanel, element).on('click', addNewGroupBtn, function (eventObject) {
            // Add new range template to page

            eventObject.preventDefault();

            var groupHandlerUrl = runtime.handlerUrl(element, 'add_group'),
                el = $(eventObject.currentTarget),
                field = el.parent().prev('.new-grp-name'),
                name = field.val();

            if (name) {

                $.ajax({
                    type: "POST",
                    url: groupHandlerUrl,
                    data: JSON.stringify({name: name}),
                    success: function (response) {
                        var success, warning;
                        if (response.success) {
                            success = true;
                            warning = false;
                            field.val('');
                            studioCommon.hideAddGroupPanel(el);
                            studioCommon.updateAllGroups(response.group_name);
                            studioCommon.updateAllResultGroupDropwdowns();

                            $(el).parents('.new-grp-container').next('.existing-grps-list').find('select').first()
                                .val(response.group_name).change();
                        } else {
                            success = true;
                            warning = false;
                        }
                        common.showMessage({
                            success: success,
                            warning: warning,
                            persist: false,
                            msg: response.msg
                        });
                    },
                    error: function (response) {
                        console.log(response);
                    }
                });
            }
        });


        $(step3Panel, element).on('click', addNewQuestionBtn, function (eventObject) {
            // Add new question template to page

            eventObject.preventDefault();
            var link = $(eventObject.currentTarget),
                existingQuestions = link.prev().find(accordionGroup).length;

            studioCommon.renderSingleQuestion(existingQuestions);
            studioCommon.initiateHtmlEditor($(questionPanel, element));
            studioCommon.refreshAccordion(questionPanel + " " + accordion);
            studioCommon.bindSortTitleSource($(questionPanel, element));
        });

        $(step3Panel, element).on('click', copyQuestionBtn, function (eventObject) {
            // copy a question

            eventObject.preventDefault();
            var link = $(eventObject.currentTarget),
                questionPanelObj = $(questionPanel, element),
                existingQuestions = link.parents(accordion).find(accordionGroup).length,
                currentQuestionContainer = link.parents(accordionHeader).nextAll(accordionContent);

            var question = {
                id: '',
                title: currentQuestionContainer.find(questionTitle).val(),
                text: currentQuestionContainer.find(questionTxt).val(),
                group: currentQuestionContainer.find(questionGroup).val(),
                choices: []
            };

            var answerChoicesInputs = $(currentQuestionContainer).find(choiceNameByClass);
            $.each(answerChoicesInputs, function (j, choice) {
                var answerChoice = {
                    'name': $(choice).val(),
                    'value': $(choice).parent().nextAll(choiceValueByClass).first().val(),
                    'category_id': $(choice).parent().nextAll(choiceResult).val()
                };
                question['choices'].push(answerChoice);
            });

            //get html for rendered question to append right next to copied question
            var html = studioCommon.renderSingleQuestion(existingQuestions, question, true);
            $(html).insertAfter(currentQuestionContainer.parent());

            //remove all tinymce binding
            studioCommon.destroyAllEditors(questionPanelObj);
            studioCommon.refreshAccordion(questionPanel + " " + accordion);
            studioCommon.bindSortTitleSource(questionPanelObj);
            studioCommon.processQuestions(questionPanelObj);
            //update text of accordion header with group name
            studioCommon.updateSortingGroupTxt(link.parents(accordionGroup).next().find(questionGroup), question.group);
        });

        $(questionPanel, element).on('click', addNewChoiceBtn, function (eventObject) {
            // Add new choice html to question container

            eventObject.preventDefault();
            var link = $(eventObject.currentTarget),
                questionContainer = link.parent(questionDiv),
                group = questionContainer.find(questionGroup).val(),
                existingQuestions = link.parents(accordionGroup).prevAll(accordionGroup).length,
                existingChoices = link.prev().find(choiceDiv).length;

            var choiceHtml = studioCommon.renderSingleChoice(existingQuestions, existingChoices, undefined, false, group);
            var choicesContainer = link.prev('ol');
            choicesContainer.append(choiceHtml);
            studioCommon.initiateHtmlEditor(choicesContainer, element);
        });

        $(categoriesPanel, element).on('click', deleteCategoryBtn, function (eventObject) {
            // delete some category

            eventObject.preventDefault();

            var btn = $(eventObject.currentTarget),
                categoriesContainer = $(btn).parents(categoriesPanel).first();

            if (categoriesContainer.find(categoryDiv).length === 1) {
                // show waring if trying to delete last category
                common.showMessage({
                    success: false,
                    warning: true,
                    persist: true,
                    msg: gettext('At least one category is required')
                }, categoriesContainer.find(accordionGroup));
            } else {
                // ask for confirmation before delete action
                if (studioCommon.confirmAction(gettext('Are you sure to delete this category?'))) {
                    var category = $(btn).parents(accordionGroup);

                    //remove deleted category html at step3 from all category selection dropdowns
                    studioCommon.removeCategoryFromOptions(category);

                    //remove all tinymce binding before deleting category html
                    studioCommon.destroyAllEditors(categoriesContainer);

                    //remove category html from DOM at current step
                    category.remove();

                    // refresh accordion
                    studioCommon.refreshAccordion(categoriesPanel + " " + accordion);

                    // rename all remaining categories fields after deletion of a category
                    studioCommon.processCategories(categoriesContainer);
                }
            }
        });

        $(rangesPanel, element).on('click', deleteRangeBtn, function (eventObject) {
            // delete existing range
            eventObject.preventDefault();

            var btn = $(eventObject.currentTarget);
            var rangesContainer = $(btn).parents(rangesPanel).first();

            if (rangesContainer.find(rangeDiv).length === 1) {
                //show waring if trying to delete last range
                common.showMessage({
                    success: false,
                    warning: true,
                    persist: true,
                    msg: gettext('At least one range is required')
                }, rangesContainer.find(accordionGroup));
            } else {
                // ask for confirmation before delete action
                if (studioCommon.confirmAction(gettext('Are you sure to delete this range?'))) {
                    var range = $(btn).parents(accordionGroup);
                    studioCommon.destroyAllEditors(rangesContainer);

                    range.remove();

                    // refresh accordion
                    studioCommon.refreshAccordion(rangesPanel + " " + accordion);

                    // rename all remaining categories fields after deletion of a category
                    studioCommon.processRanges(rangesContainer);
                }
            }
        });

        $(questionPanel, element).on('click', deleteQuestionBtn, function (eventObject) {
            // delete question
            eventObject.preventDefault();
            var btn = $(eventObject.currentTarget);
            var questionsContainer = $(btn).parents(questionPanel).first();

            if (questionsContainer.find(questionDiv).length === 1) {
                //show waning if tring to delete last question
                common.showMessage({
                    success: false,
                    warning: true,
                    persist: true,
                    msg: gettext('At least one question is required')
                }, questionsContainer.find(accordionGroup));
            } else {
                //ask for confirmation before delete action
                if (studioCommon.confirmAction(gettext('Are you sure to delete this question?'))) {
                    var question = $(btn).parents(accordionGroup);

                    // remove all tinymce binding before deleting question html
                    studioCommon.destroyAllEditors(questionsContainer);

                    //remove question html from DOM
                    question.remove();

                    // refresh accordion
                    studioCommon.refreshAccordion(questionPanel + " " + accordion);

                    // rename all remaining categories fields after deletion of a category
                    studioCommon.processQuestions(questionsContainer);
                }
            }
        });

        $(questionPanel, element).on('change', questionGroup, function (eventObject) {
            eventObject.preventDefault();
            var group = $(eventObject.target).val();
            var groupCategories = studioCommon.getGroupCategories(group);
            studioCommon.updateSortingGroupTxt($(eventObject.target), group);
            studioCommon.updateAllResultDropwdowns($(eventObject.target), groupCategories);
        });

        $(editQuestionPanel, element).on('change', resultGroup, function (eventObject) {
            eventObject.preventDefault();
            var group = $(eventObject.target).val();
            studioCommon.updateSortingGroupTxt($(eventObject.target), group);
        });

        $(questionPanel, element).on('click', deleteChoiceBtn, function (eventObject) {
            // delete question choice

            eventObject.preventDefault();

            var btn = $(eventObject.currentTarget);
            var answersContainer = $(btn).parents(questionDiv).first();

            if (answersContainer.find(choiceDiv).length === 1) {
                //show warning if trying to delete last choice
                common.showMessage({
                    success: false,
                    warning: true,
                    msg: gettext('At least one answer is required')
                }, answersContainer);
            } else {
                //ask for confirmation before delete action
                if (studioCommon.confirmAction(gettext('Are you sure to delete this choice?'))) {
                    // remove all tinymce binding before deleting choice html
                    studioCommon.destroyAllEditors(answersContainer.find('ol'));

                    //remove choice html from DOM
                    $(btn).parent(choiceDiv).remove();

                    studioCommon.processChoices(answersContainer);
                }
            }
        });

        $(editQuestionPanel, element).on('click', closeMsgBtn, function (eventObject) {
            eventObject.preventDefault();

            var btn = $(eventObject.currentTarget);
            var msgDiv = btn.parents('.msg');
            btn.parents("h3").first().html("");
            msgDiv.slideUp('slow');
        });

        renderSteps();
        studioCommon.initiateHtmlEditor($step1Panel, true);
        studioCommon.bindSortTitleSources();

        $('.action-cancel').click(function (eventObject) {
            // notify runtime that modal windows is going to close
            eventObject.preventDefault();
            studioCommon.notify('destoryEditors', {});
        });

        runtime.listenTo('destoryEditors', function () {
            // Destroy all editor as modal window closed
            studioCommon.destroyAllEditors($(editQuestionPanel, element));
            runtime.modal.editOptions.refresh(runtime.modal.xblockInfo);
        });
    });

}
