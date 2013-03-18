<#-- $This file is distributed under the terms of the license in /doc/license.txt$ -->

<#-- Macros related to the display of vivo ontology properties -->

<#import "lib-properties.ftl" as p>

<#assign core = "http://vivoweb.org/ontology/core#">

<#-- Display preferredTitle if it exists; otherwise display mostSpecificTypes -->
<#macro displayTitle individual>
    <#if individual.preferredTitle?has_content>
        <span class="display-title">${individual.preferredTitle}</span>
    <#else>
        <@p.mostSpecificTypes individual />
    </#if>
</#macro>


<#-- core:webpage
     
     Note that this macro has a side-effect in the call to propertyGroups.pullProperty().
-->
<#macro webpages propertyGroups editable linkListClass="individual-urls">
    <#local webpage = propertyGroups.pullProperty("${core}webpage")!>

    <#if webpage?has_content> <#-- true when the property is in the list, even if not populated (when editing) -->
        <nav role="navigation">
            <#local label = "Web Pages">  
            <@p.addLinkWithLabel webpage editable label />           
            <#if webpage.statements?has_content> <#-- if there are any statements -->
                <ul class="${linkListClass}" id="webpages" role="list">
                    <@p.objectPropertyList webpage editable />
                </ul>
            </#if>
        </nav>
    </#if>
</#macro>

<#macro vivoLinks propertyGroups namespaces editable linkListClass="individual-urls">
    <#local webLinks = propertyGroups.pullProperty("http://vivoweb.org/ontology/core#webpage")!>

    <#if (webLinks?has_content)> <#-- true when the property is in the list, even if not populated (when editing) -->
            <@addLinkWithLabel webLinks editable "Web Pages" />
            <#if webLinks.statements?has_content> <#-- if there are any statements -->
            <ul class="${linkListClass}">
                <li><@objectPropertyList webLinks editable /></li>
            </ul>
            </#if>
    </#if>
</#macro>