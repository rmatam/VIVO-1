(function ($) {

AjaxSolr.MultiCheckboxFacet = AjaxSolr.AbstractFacetWidget.extend({
   /**
   * Default facet query
   *
   * @defaultQuery
   * @public
   * @type String
   */
  defaultQuery: null,	
	

  /**
   * Generate a facet
   */
  afterRequest: function () {
    var target = $(this.target);

    // Always empty the facet first
    target.empty().removeClass('active-facet');
	
	// get the current selected classgroup
    if (key = this.manager.store.findByKey('fq', 'classgroup')) {
      var group = this.manager.store.params['fq'][key];
      var resultType = 'All';
      if (group.value !== undefined) {
		  if (groups[group.value] !== undefined) {
			resultType = groups[group.value].name.toLowerCase();
		  } 
      } else {
      		if (groups[0] !== undefined) {
			resultType = groups[0].name.toLowerCase();
		  } 
      }
    }
    //remove some facets for some classgroups
    if (typeof resultType != 'undefined') {
    	if ( this.field == 'op_context_mostSpecificTypeLabel' && resultType != 'publications') {
		  return;
		};	
    }
    

    // Don't continue unless we have results and facet items
    if (this.manager.response.response.numFound && (list = this.buildFacet())) {

      // Bind expand/collapse behavior to facet titles
      var heading = $('<h4></h4>').addClass('facet-title').text(this.title).prepend('<span class="icon"></span>').click(function() {
        $(this).parents('.facet').children('ul').slideToggle();
        $(this).parents('.facet').toggleClass('collapsed');
      });
      target.append(heading).append(list).addClass('active-facet');

      // Add a main facet heading if this is the first facet
      if (this.target == '#search-facet-1') {
        //target.prepend($('<h3></h3>').addClass('facet-header').text('Show '+resultType+' by'));
      }
    }
  },


  /**
   * Build the actual list of facet items
   */
  buildFacet: function() {
  	var self = this;
  	    
    
    var facets = this.facets();
    var activeFacets = this.getActive();
    var limit = (this.limit != null) ? this.limit : 5;
    var includeShowallLink = false;
    


    // Don't continue if there is nothing to work with
    if (facets < 1 && activeFacets < 1) return false;

    var list = $('<ul></ul>');
    list.append(AjaxSolr.theme('facet_checkbox', 'Any', 0, this.isEmpty(), 'select-any', this.id+'-all', this.allResultsClickHandler()));

    var count = 1; // Count used for #id values

    // Loop through facets that came back with Solr response
    if (facets.length != 0) {
      for (i=0; i<facets.length; i++) {
        var title = facets[i].value;
        var id = this.id + '-' + count;
        var checked = false;
        var handler = this.clickHandler();
        var activeIndex = AjaxSolr.inArray(title, activeFacets);

        // Add the initial (5) checkboxes
        if (i < limit) {
          if (activeIndex > -1) {
            checked = true;
            activeFacets.splice(activeIndex,1);
          }
          list.append(AjaxSolr.theme('facet_checkbox', title, facets[i].count, checked, 'unchecked', id, handler));
          count++;
        }
        else if (activeIndex > -1) { // Then append any other active checkboxes that have facet counts
          checked = true;
          activeFacets.splice(activeIndex,1);
          list.append(AjaxSolr.theme('facet_checkbox', title, facets[i].count, checked, 'checked', id, handler));
          count++;

        }
        
      }

      // Each facet widget should have an item limit set in its config. In AbstractFacetWidget,
      // we add 1 to this limit when telling Solr how many facet items to return. If the number
      // of items returned by Solr is more than our set limit, we can assume there are additional
      // facet items to offer a user, and therefore include a "Show all" link.
      if (facets.length > limit) includeShowallLink = true;
          
    }  

		//Filter and hide long lists of selected facets.
		if (facets.length > 10) {
			
			//check to see how long the widget will be
	  	var myItems = list.children('li').size();
	  	if (myItems > 10){  
	  		//shorten it first by hiding the initial five items
	  		list.children('li.unchecked').hide();
	  		//get the selected items and hide all but the first eight
	  		var checkedItems = list.children('li.checked').length;
	  		if (checkedItems > 8) {
	  			list.children('li.checked').hide().filter(':lt(8)').show(); 
	  		}
	  		//append a 'show' link that will disappear once clicked.
	  		list.append($('<li class="show-all">... Show '+ (checkedItems - 8) +' Additional Selections</li>')).click(function(){
	  			list.children('li.checked').show();
	  			list.children('li.show-all').hide();
	  		});
	  	}
		}

    // There may still be leftovers that were previously selected
    // but are not part of the response and no longer have facet counts
    if (activeFacets.length > 0) {
      for (var i=0; i < activeFacets.length; i++) {
        var id = this.id + '-' + count;
        var handler = this.clickHandler();
        list.append(AjaxSolr.theme('facet_checkbox', activeFacets[i], 0, true, '', id, handler));
      }
    }

    if (popups[this.id] !== undefined && includeShowallLink) {
      list.append($('<li class="select-more"></li>').append(AjaxSolr.theme('facet_showall_link', this.popupHandler())));
    }

    return list;
  },

  
  /**
   * Change handler for "Any" checkboxes
   */
  allResultsClickHandler: function() {
    var self = this;
    return function () {
      $(this).blur();
      self.clear();
      self.manager.doRequest(0);
      return false;
    }
  },


  /**
   * Click handler for "Show all" popup links
   */
  popupHandler: function() {
    var self = this;
    return function() {

      // Only work if we have a popup availale
      if (popups[self.id] !== undefined) {

        var widget = popups[self.id];
        var target = $(widget.target);

        // Add popup to the manager if it's not already there,
        // then initialize and retrieve new facet data
        if (self.manager.widgets[self.id+'_popup'] === undefined) {
          self.manager.addWidget(widget);
          self.manager.widgets[widget.id].init();

          // Retrieve new data using the same method as Manager.executeRequest()
          // but without triggering updates to other widgets
          target.append(AjaxSolr.theme('loader_image'));
          var queryString = self.manager.store.string().replace("&q=%20&","&q=&");
          jQuery.getJSON(self.manager.solrUrl + self.manager.servlet + '?' + queryString + '&wt=json&json.wrf=?', {}, function (data) {
            self.manager.response = data;
            widget.afterRequest();
          });
        } else {
            // Popup exists, so just redisplay it
            widget.afterRequest();
        }
        target.dialog(widget.popupOptions());
      }
      return false;
    }
  },


  /**
   * Change handler for facet checkboxes
   */
  clickHandler: function () {
    var self = this;
    return function() {
      $(this).blur();

      // $('#dialog').dialog('close');

      // Scan through facet and find all checked checkboxes
      var values = [];
      $(self.target).find('input:checked').not('.select-any input').each(function() {
        values.push($(this).attr('name'));
      });

      // If all have been unchecked, reset the facet to 'Any'
      if (values.length < 1) {
        self.clear();
        self.manager.doRequest(0);
        return false;
      }

      var param = new AjaxSolr.Parameter({
        name: 'fq',
        key: self.field,
        value: values,
        filterType: 'subquery',
        operator: 'OR'
      });

      if (self.tagAndExclude) {
        param.local('tag', self.id);
      }

      if (self.set.call(self, param)) {
        self.manager.doRequest(0);
      }
      return false;
    }
  },


  /**
   * Get all active facet items for this facet
   */
  getActive: function() {
    var facets = [];
    if (keys = this.manager.store.findByKey('fq', this.field)) {
      for (var i=0; i<keys.length; i++) {
      	
        var param = this.manager.store.params['fq'][keys[i]];
        
        if (AjaxSolr.isArray(param.value)) {
          for (var j=0; j<param.value.length; j++) {
            facets.push(param.value[j]);
          }
        }
        else {
          facets.push(param.value);
        }
      }
    }
    return facets;
  },


  /**
   * Override original function to prevent re-sorting of facets
   */
  facets: function () {
    return this.responseFacets();;
  },


  /**
   * Override original function to prevent extra quotes from being added
   */
  fq: function (value, exclude) {
    return value;
  }

});



})(jQuery);