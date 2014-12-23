'use strict';

(function()
{
  var module = angular.module('myApp', [
	  'ui.router',
	  'myApp.filters',
	  'myApp.services',
	  'myApp.directives',
	  'myApp.controllers',
	  'd3'
  ]);
  module.config(['$stateProvider', configFunc]);
	module.run(['$state', runFunc])
  //////////////////////////////////////////////////

  function configFunc($stateProvider)
  {
    $stateProvider.state('view1',
	    {
		    url: '/view1',
		    templateUrl: 'partials/partial1.html',
		    controller: 'MyCtrl1'
	    }
    );
    $stateProvider.state('view2',
	    {
		    url: '/view2',
		    templateUrl: 'partials/partial2.html',
		    controller: 'MyCtrl2'
	    }
    );
  }

	function runFunc($state)
	{
		$state.go('view1');
	}

})();