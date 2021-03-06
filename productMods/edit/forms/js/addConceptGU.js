/*
Copyright (c) 2011, Cornell University
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.
    * Neither the name of Cornell University nor the names of its contributors
      may be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


var addConceptForm = {



    /* *** Initial page setup *** */

   

    onLoad: function() {

        

        if (this.disableFormInUnsupportedBrowsers()) {

            return;

        }        

        this.mixIn();

        this.initObjects();    

        this.initPage();

    },



    disableFormInUnsupportedBrowsers: function() {       

        var disableWrapper = $('#ie67DisableWrapper');

        

        // Check for unsupported browsers only if the element exists on the page

        if (disableWrapper.length) {

            if (vitro.browserUtils.isIELessThan8()) {

                disableWrapper.show();

                $('.noIE67').hide();

                return true;

            }

        }            

        return false;      

    },



    mixIn: function() {

        // Mix in the custom form utility methods

        $.extend(this, vitro.customFormUtils);

        // Get the custom form data from the page

        $.extend(this, customFormData);

    },

    // On page load, create references for easy access to form elements.

    initObjects: function() {

        

        this.form = $('#addConceptForm');

        this.showFormButtonWrapper = $('#showAddForm');

        this.submit = this.form.find(':submit');

        this.cancel = this.form.find('.cancel'); 

        //Add term

        this.addConceptButton = $('#showAddFormButton');

        //section where results should be displayed

        this.selectedConcept = $('#selectedConcept');

        //input for search term form

        this.searchTerm = $('#searchTerm');

        this.searchSubmit = $('#searchButton');

        //Hidden inputs for eventual submission

        this.externalConceptURI = $('#conceptNode');

        this.externalConceptLabel = $('#conceptLabel');

        this.externalConceptSource = $('#conceptSource');

        //remove links

        this.removeConceptLinks = $('a.remove');
        this.addConceptLinks = $('a.add');

        this.errors = $('#errors');

        this.createOwn1 = $('#createOwnOne');

        this.createOwn2 = $('#createOwnTwo');

        this.orSpan = $('span.or')

    },

    

    initPage: function() {

    	this.initConceptData();

        this.bindEventListeners();

              

    },

    bindEventListeners: function() {

    	this.searchSubmit.click(function() {

    		addConceptForm.clearErrors();

            addConceptForm.submitSearchTerm();

            return false;

         });

    	

    	this.form.submit(function() {

			return addConceptForm.prepareSubmit(); 

        });     

    	

    	this.addConceptButton.click(function() {

    		addConceptForm.initForm();

    		

    	});

    	 this.removeConceptLinks.click(function() {

             addConceptForm.removeExistingConcept(this);

             return false;

         });
         
         this.addConceptLinks.click(function() {

             addConceptForm.addNewConcept(this);

             return false;

         });

    },

    initForm: function() {

        // Hide the button that shows the form

        this.showFormButtonWrapper.hide(); 

        this.clearSearchResults();

        // Hide the create own link, add selected button and "or"" span

        this.orSpan.hide();

        this.createOwn2.hide();

        this.submit.hide();

        //Also clear the search input

        this.searchTerm.val("");

        this.cancel.unbind('click');



        // Show the form

        this.form.show();                 

    },   

 // On page load, associate data with each existing term  element. Then we don't

    // have to keep retrieving data from or modifying the DOM as we manipulate the

    // authorships.

    initConceptData: function() {

        $('.existingConcept').each(function(index) {

            $(this).data(existingConceptsData[index]);    
            
            $(this).data(forCodeData[index]);    

            $(this).data('position', index+1);      

        });

    },

    clearSearchResults:function() {

    	$('#selectedConcept').empty();

    },

    clearErrors:function() {

    	addConceptForm.errors.empty();

    },

    showHiddenElements:function(results) {

        this.createOwn1.hide();

        if ( results ) {

            this.orSpan.show();

            this.createOwn2.show();

            this.submit.show();

        }

        else {

            this.orSpan.show();

            this.createOwn2.show();

        }

    },

    showConceptListOnlyView: function() {

        this.hideForm();

        this.showFormButtonWrapper.show();

    },

    submitSearchTerm: function() {

    	//Get value of search term

    	var searchValue = this.searchTerm.val();

    	var checkedVocabSource = $('input:radio[name="source"]:checked');

    	var hasResults = false;

    	if(!checkedVocabSource.length) {

    		addConceptForm.showUncheckedSourceError();

    		return;

    	}

    	var vocabSourceValue = checkedVocabSource.val();

    	var dataServiceUrl = addConceptForm.dataServiceUrl + "?searchTerm=" + encodeURIComponent(searchValue) + "&source=" + encodeURIComponent(vocabSourceValue);

        //This should return an object including the concept list or any errors if there are any

    	$.getJSON(dataServiceUrl, function(results) {

            var htmlAdd = "";

            var vocabUnavailable = "<p>The vocabulary service is unavailable. Please try again later.</p>";

            if ( results== null  || results.semanticServicesError != null || results.conceptList == null) {

            	htmlAdd = vocabUnavailable;

            }

            else {

            	//array is an array of objects representing concept information

            	//loop through and find all the best matches

            	var bestMatchResults = addConceptForm.parseResults(results.conceptList);

                var numberMatches = bestMatchResults.length;

                var i;

                //For each result, display

                if(numberMatches > 0) {

                	htmlAdd = "<ul class='dd' id='concepts' name='concepts'>";

                	htmlAdd+= addConceptForm.addResultsHeader();

	                for(i = 0; i < numberMatches; i++) {

	                	var conceptResult = bestMatchResults[i];

	                	var conceptId = conceptResult.conceptId;

	                	var label = conceptResult.label;

	                	var definition = conceptResult.definition;

	                	var definedBy = conceptResult.definedBy;

	                	var type = conceptResult.type;

	                	var uri = conceptResult.uri;

	                	htmlAdd+= addConceptForm.generateIndividualConceptDisplay(uri, label, definition, type, definedBy);

	                }

	                htmlAdd+= "</ul>";

                } else {

                	htmlAdd+= "<p>No search results were found.</p>";

                }

            	

            }

            if(htmlAdd.length) {

            	$('#selectedConcept').html(htmlAdd);

            	if (htmlAdd.indexOf("No search results") >= 0) {

            	    addConceptForm.showHiddenElements(hasResults);

            	}

            	else {

            	   hasResults = true;

                   addConceptForm.showHiddenElements(hasResults);

                }

            }

          });

        return true;

    },

    parseResults:function(resultsArray) {

    	//Loop through array and check if this is the best match

    	var arrayLen = resultsArray.length;

    	var bestMatchResults = new Array();

    	var i;

    	for(i = 0; i < arrayLen; i++) {

    		var concept = resultsArray[i];

    		if(concept.bestMatch != "false") {

    			bestMatchResults.push(concept);

    		}

    	}

    	return bestMatchResults;

    },

    addResultsHeader:function() {

    	var htmlAdd = "<li class='concepts'><div class='row'><span class='column conceptLabel'>Label (Type) </span><span class='column conceptDefinition'>Definition</span></div></li>";

    	return htmlAdd;

    },

    hideSearchResults:function() {

    	this.selectedConcept.hide();

    },

    prepareSubmit:function() {

    	var checkedElements = $("input[name='CUI']:checked");

    	if(!addConceptForm.validateConceptSelection(checkedElements)) {

    		return false;

    	}

    	var i;

    	var len = checkedElements.length;

    	var checkedConcept, checkedConceptElement, conceptLabel, conceptSource;

    	var conceptNodes = [];

    	var conceptLabels = [];

    	var conceptSources = [];

    	

    	checkedElements.each(function() {

    		checkedConceptElement = $(this);

    		checkedConcept = checkedConceptElement.val();

    		conceptLabel = checkedConceptElement.attr("label");

    		conceptSource = checkedConceptElement.attr("conceptDefinedBy");

    		conceptNodes.push(checkedConcept);

    		conceptLabels.push(conceptLabel);

    		conceptSources.push(conceptSource);

    	});

    	this.externalConceptURI.val(conceptNodes);

    	this.externalConceptLabel.val(conceptLabels);

    	this.externalConceptSource.val(conceptSources);

    	return true;

    }, 

    generateIndividualConceptDisplay: function(cuiURI, label, definition, type, definedBy) {

    	var htmlAdd = "<li class='concepts'>" + 

    	"<div class='row'>" + 

    	"<span class='column conceptLabel'>" +

    	addConceptForm.generateIndividualCUIInput(cuiURI, label, type, definedBy) +  

    	label + addConceptForm.generateIndividualTypeDisplay(type) + "</span>" + 

    	addConceptForm.generateIndividualDefinitionDisplay(definition) + 

    	"</div>" +  

    	"</li>";	

    	return htmlAdd;

    }, 

    generateIndividualCUIInput:function(cuiURI, label, type, definedBy) {

    	return 	"<input type='checkbox'  name='CUI' value='" + cuiURI + "' label='" + label + "' conceptType='" + type + "' conceptDefinedBy='" + definedBy + "'/>";

    },

    generateIndividualTypeDisplay:function(type) {

    	if(type != null && type.length > 0) {

    		return " (" + type + ")";

    	}

    	return "";

    },

    generateIndividualDefinitionDisplay:function(definition) {

    	return "<span class='column conceptDefinition'>" + definition + "</span>";

    },

    validateConceptSelection:function(checkedElements) {

    	var numberElements = checkedElements.length;

    	if(numberElements < 1) {

    		addConceptForm.errors.html("<p class='validationError'>Please select at least one term from the search search results.</p>");

    		return false;

    	}

    	return true;

    }, 

    showUncheckedSourceError:function() {

		addConceptForm.errors.html("<p class='validationError'>Please select at least one external vocabulary source to search.</p>");

    },

    removeExistingConcept: function(link) {

        var removeLast = false,

            message = 'Are you sure you want to remove this term?';

            

        if (!confirm(message)) {

            return false;

        }

        

        if ($(link)[0] === $('.remove:last')[0]) {

            removeLast = true;

        } 
		var uri = $(link).parents('span.concept').children('span.conceptWrapper').children('span.conceptURI').text();
		var label = $(link).parents('span.concept').children('span.conceptWrapper').children('span.conceptLabel').text();
		
		
		
		collatedRemovals.push( addConceptForm.generateDeletionN3( $.trim(uri) ) );
		//console.log( uri );
		//console.log( label );
		$(link).parents('li.existingConcept').remove();

		/*
		
        //Using primitive rdf edit which expects an n3 string for deletion
        $.ajax({

            url: $(link).attr('href'),

            type: 'POST', 

            data: {

        		additions: '', 

                retractions: addConceptForm.generateDeletionN3($(link).parents('.existingConcept').data('conceptNodeUri'))

            },

            dataType: 'json',

            context: link, // context for callback

            complete: function(request, status) {

                var existingConcept,

                    conceptNodeUri;

            

                if (status === 'success') {

                    

                    existingConcept = $(this).parents('.existingConcept');

                    existingConcept.fadeOut(400, function() {

                        var numConcepts;

                        // For undo link: add to a deletedAuthorships array

                        // Remove from the DOM                       

                        $(this).remove();

                        // Actions that depend on the author having been removed from the DOM:

                        numConcepts = $('.existingConcept').length; // retrieve the length after removing authorship from the DOM        

                    });



                } else {

                    alert('Error processing request: term not removed');

                }

            }

        });        
        
        */

    },
    
    addNewConcept: function(link) {

        var removeLast = false,

        message = 'Are you sure you want to add this term?';

        if (!confirm(message)) {
            return false;
        }

        
        if ($(link)[0] === $('.remove:last')[0]) {
            removeLast = true;
        } 

        //Using primitive rdf edit which expects an n3 string for deletion
       
        $.ajax({

            url: $(link).attr('href'),

            type: 'POST', 

            data: {

        		retractions: '', 

                additions: addConceptForm.generateAdditionN3($(link).parents('.concept').children('.conceptURI').text())

            },

            dataType: 'json',

            context: link, // context for callback

            complete: function(request, status) {

                var existingConcept,

                    conceptNodeUri;

            

                if (status === 'success') {
                   	var conceptLabel = $(this).parents('.concept').children('span.conceptWrapper').children('.conceptLabel').text();
					
                	$('#existingConcepts').append('<li class="existingConcept"><span class="concept"><span class="conceptWrapper"><span class="conceptLabel">'+conceptLabel+'</span> </span></span></li>').fadeIn(400);

                } else {

                    alert('Error processing request: term not added');

                }

            }

        });        

    },

    generateDeletionN3: function(conceptNodeUri) {

    	var n3String = "<" + addConceptForm.subjectUri + "> <" + addConceptForm.predicateUri + "> <" + conceptNodeUri + "> .";

    	//add inverse string to also be removed

    	if(addConceptForm.inversePredicateUri.length > 0) {

    		n3String += "<" + conceptNodeUri + "> <" + addConceptForm.inversePredicateUri + "> <" + addConceptForm.subjectUri + "> .";

    	}

    	return n3String;

    },
    
    generateAdditionN3: function(conceptNodeUri) {

    	var n3String = "<" + addConceptForm.subjectUri + "> <" + addConceptForm.predicateUri + "> <" + conceptNodeUri + "> .";

    	//add inverse string to also be added

    	if(addConceptForm.inversePredicateUri.length > 0) {

    		n3String += "<" + conceptNodeUri + "> <" + addConceptForm.inversePredicateUri + "> <" + addConceptForm.subjectUri + "> .";

    	}

    	return n3String;

    },
    generateAdditionN3WithLabel: function(conceptNodeUri, termLabel, newObjectTypeURI) {
        var RDFTypeURI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
        var RDFDLabelURI = 'http://www.w3.org/2000/01/rdf-schema#label';
        var n3String = "<" + addConceptForm.subjectUri + "> <" + addConceptForm.predicateUri + "> <" + conceptNodeUri + "> .";

        if(newObjectTypeURI.length > 0) {
            n3String += "<" + conceptNodeUri + "> <" + RDFTypeURI + "> <" + newObjectTypeURI + "> .";
        }  
        if(termLabel.length > 0) {
            n3String += "<" + conceptNodeUri + "> <" + RDFDLabelURI + "> \"" + termLabel + "\" .";
        }        

        //add inverse string to also be added

        if(addConceptForm.inversePredicateUri.length > 0) {

            n3String += "<" + conceptNodeUri + "> <" + addConceptForm.inversePredicateUri + "> <" + addConceptForm.subjectUri + "> .";

        }

        return n3String;

    }

};



$(document).ready(function() {   

    addConceptForm.onLoad();

}); 

