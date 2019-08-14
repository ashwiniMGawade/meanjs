(function () {
  'use strict';

  angular
    .module('core')
    .controller('HomeController', HomeController);

  function HomeController() {
    var vm = this;
    vm.oneAtATime = true;
    vm.showFaq  = false;

    vm.items = ['Item 1', 'Item 2', 'Item 3'];

    vm.addItem = function() {
      var newItemNo = vm.items.length + 1;
      vm.items.push('Item ' + newItemNo);
    };

    vm.status = {
      isCustomHeaderOpen: false,
      isFirstOpen: false,
      isFirstDisabled: false
    };
    vm.faq_headings = [
    	"How can I get Space for my Project in Enterprise Storage?",
    	"How is the backup taken for the data kept on Project Shares?",
    	"Is the data available at remote site in case of disaster?",
    	"Do we have hardware redundancy for these servers?",
    	"How much space can be given for a new Project?",
    	"Can I increase the space of my project share?",
    	"Our project is moving from one DC to another. What can be done for this?",
    	"How do I access my project share?",
    	"How can I get access to my Project Share?",
    	"For my Project, the CC is on leave for the day. I need to access files urgently. What can be done?",
    	"What the responsibilities of CC of a project?",
    	"I'm the CC of the Project XYZ. How do I add or remove permissions for my team members?",
    	"Important Points to be noted for CC role"
    ]
    vm.togleFaq = function() {
    	vm.showFaq =! vm.showFaq;
    }
  }
}());
