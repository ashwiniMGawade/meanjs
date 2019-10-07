(function ()  {
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
    vm.togleFaq = function (id) {
      vm.showFaq = !vm.showFaq;
      if (vm.showFaq) {
        vm.scrollToHelpSection(id);
      }
    }

    vm.scrollToHelpSection = function(id) {
      console.log(id);
      vm.doScrolling(id, 200);
    }

    vm.doScrolling = function(element, duration) {
      var startingY = window.pageYOffset
      var elementY = vm.getElementY(element);
      console.log('element-y:', elementY);
      var targetY = document.body.scrollHeight - elementY < window.innerHeight ? document.body.scrollHeight - window.innerHeight : elementY
      var diff = targetY - startingY 
      console.log('diff:', diff); 
      var easing = function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 }
      var start  
 
      if (!diff) return
    
      // Bootstrap our animation - it will get called right before next frame shall be rendered.
      window.requestAnimationFrame(function step(timestamp) {
       
        if (!start) start = timestamp
        // Elapsed miliseconds since start of scrolling.
        var time = timestamp - start
        // Get percent of completion in range [0, 1].
        var percent = Math.min(time / duration, 1)
        // Apply the easing.
        // It can cause bad-looking slow frames in browser performance tool, so be careful.
        percent = easing(percent)
        console.log(startingY + diff * percent);
        
        window.scrollTo(0, startingY - diff * 2 * percent)
    
        // Proceed with animation as long as we wanted it to.
        if (time < duration) {
          window.requestAnimationFrame(step)
        }
      })
    }

    vm.getElementY = function(query) {    
      return window.pageYOffset + document.querySelector('#'+query).getBoundingClientRect().top
    }
  }

}());



