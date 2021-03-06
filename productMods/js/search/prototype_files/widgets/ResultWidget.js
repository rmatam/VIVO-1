(function ($) {

AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
  
  
  /**
   * Build the results list
   */
  afterRequest: function () {
    var target = $(this.target);
    target.empty();
    
    // If there are no results, don't do anything further
    // except to determine what kind of results we're
    // attempting to find based on active group.
    if (this.manager.response.response.numFound < 1) {
      
      var queryText = this.manager.store.get('q').val();
      var resultType = 'pages';
      if (this.manager.store.findByKey('fq', 'classgroup')) {
        var group = this.manager.store.params['fq'][0];
        if (groups[group.value] !== undefined) {
          resultType = groups[group.value].name.toLowerCase();
        }
      }
      
      target.append(AjaxSolr.theme('empty_results', queryText, resultType));
      
      return;
    }
    
    var list = $('<ul/>').addClass('results-list');
    
    for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
      var doc = this.manager.response.response.docs[i];
      var snippet = '';
      var docId_prefix = 'vitroIndividual:';
      //console.log(doc);
      //console.log(this.manager.response.highlighting);
      if (this.manager.response.highlighting && this.manager.response.highlighting[docId_prefix+''+doc.URI].ALLTEXT !== undefined) {
        var highlighted = this.manager.response.highlighting[docId_prefix+''+doc.URI].ALLTEXT;
        snippet = '... ' + highlighted.join(' ... ') + ' ...';
      };
      list.append($('<li/>').append(AjaxSolr.theme('result', doc, snippet)));
    }
    
    target.append(list);
  },
  
  
  /**
   * Append the spinner image while waiting for Solr response
   */
  beforeRequest: function () {
    $(this.target).empty().append(AjaxSolr.theme('loader_image'));
  }
  
});
  
})(jQuery);