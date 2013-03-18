
/* $This file is distributed under the terms of the license in /doc/license.txt$ */

package edu.cornell.mannlib.vitro.webapp.edit.n3editing.configuration.generators;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import javax.servlet.http.HttpSession;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import edu.cornell.mannlib.vitro.webapp.auth.permissions.SimplePermission;
import edu.cornell.mannlib.vitro.webapp.auth.requestedAction.Actions;
import edu.cornell.mannlib.vitro.webapp.beans.Individual;
import edu.cornell.mannlib.vitro.webapp.beans.VClass;
import edu.cornell.mannlib.vitro.webapp.controller.VitroRequest;
import edu.cornell.mannlib.vitro.webapp.dao.VitroVocabulary;
import edu.cornell.mannlib.vitro.webapp.dao.WebappDaoFactory;
import edu.cornell.mannlib.vitro.webapp.edit.n3editing.VTwo.EditConfigurationUtils;
import edu.cornell.mannlib.vitro.webapp.edit.n3editing.VTwo.EditConfigurationVTwo;
import edu.cornell.mannlib.vitro.webapp.utils.FrontEndEditingUtils;
import edu.cornell.mannlib.vitro.webapp.utils.FrontEndEditingUtils.EditMode;

/**
 * Generates the edit configuration for a default property form.
 *
 */
public class AutocompleteDataPropertyFormGenerator extends DefaultDataPropertyFormGenerator {

	//The only thing that changes here are the templates
	private Log log = LogFactory.getLog(AutocompleteObjectPropertyFormGenerator.class);
	private String dataPropertyTemplate = "autoCompleteDataPropForm.ftl";
	

	@Override
	public EditConfigurationVTwo getEditConfiguration(VitroRequest vreq, HttpSession session) {
		EditConfigurationVTwo ec = super.getEditConfiguration(vreq, session);
		this.addFormSpecificData(ec, vreq);
		return ec;
	}
	
	public void addFormSpecificData(EditConfigurationVTwo editConfiguration, VitroRequest vreq) {
		HashMap<String, Object> formSpecificData = new HashMap<String, Object>();
		//Filter setting - i.e. sparql query for filtering out results from autocomplete
		formSpecificData.put("sparqlForAcFilter", getSparqlForAcFilter(vreq));
		editConfiguration.setTemplate(dataPropertyTemplate);
		//Add edit model
		formSpecificData.put("editMode", getEditMode(vreq));
		editConfiguration.setFormSpecificData(formSpecificData);
	}
	
	public String getSparqlForAcFilter(VitroRequest vreq) {
		String subject = EditConfigurationUtils.getSubjectUri(vreq);			
		String predicate = EditConfigurationUtils.getPredicateUri(vreq);
		//Get all objects for existing predicate, filters out results from addition and edit
		String query =  "SELECT ?dataLiteral WHERE { " + 
			"<" + subject + "> <" + predicate + "> ?dataLiteral .} ";
		return query;
	}
	
	//Get edit mode
	public String getEditMode(VitroRequest vreq) {
       if(isUpdate(vreq)) 
    	   return "edit";
        else
    	   return "add";
	}
	
	private boolean isUpdate(VitroRequest vreq) {
		Integer dataHash = EditConfigurationUtils.getDataHash(vreq);
		return ( dataHash != null );
	}
	
}
