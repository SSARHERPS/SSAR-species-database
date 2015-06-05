###
# The main coffeescript file for administrative stuff
# Triggered from admin-page.html
###
adminParams = new Object()
adminParams.apiTarget = "admin_api.php"
adminParams.adminPageUrl = "http://ssarherps.org/cndb/admin-page.html"
adminParams.loginDir = "admin/"
adminParams.loginApiTarget = "#{adminParams.loginDir}async_login_handler.php"

loadAdminUi = ->
  ###
  # Main wrapper function. Checks for a valid login state, then
  # fetches/draws the page contents if it's OK. Otherwise, boots the
  # user back to the login page.
  ###
  try
    verifyLoginCredentials (data) ->
      # Post verification
      articleHtml = """
      <h3>
        Welcome, #{$.cookie("ssarherps_name")}
        <span id="pib-wrapper-settings" class="pib-wrapper" data-toggle="tooltip" title="User Settings" data-placement="bottom">
          <paper-icon-button icon='settings-applications' class='click' data-url='#{data.login_url}'></paper-icon-button>
        </span>
        <span id="pib-wrapper-exit-to-app" class="pib-wrapper" data-toggle="tooltip" title="Go to CNDB app" data-placement="bottom">
          <paper-icon-button icon='exit-to-app' class='click' data-url='#{uri.urlString}' id="app-linkout"></paper-icon-button>
        </span>
      </h3>
      <div id='admin-actions-block'>
        <div class='bs-callout bs-callout-info'>
          <p>Please be patient while the administrative interface loads.</p>
        </div>
      </div>
      """
      $("article").html(articleHtml)
      $(".pib-wrapper").tooltip()
      ###
      # Render out the admin UI
      # We want a search box that we pipe through the API
      # and display the table out for editing
      ###
      searchForm = """
      <form id="admin-search-form" onsubmit="event.preventDefault()" class="row">
        <div>
          <paper-input label="Search for species" id="admin-search" name="admin-search" required autofocus floatingLabel class="col-xs-7 col-sm-8"></paper-input>
          <paper-fab id="do-admin-search" icon="search" raisedButton class="materialblue"></paper-fab>
          <paper-fab id="do-admin-add" icon="add" raisedButton class="materialblue"></paper-fab>
        </div>
      </form>
      <div id='search-results' class="row"></div>
      """
      $("#admin-actions-block").html(searchForm)
      $("#admin-search-form").submit (e) ->
        e.preventDefault()
      $("#admin-search").keypress (e) ->
        if e.which is 13 then renderAdminSearchResults()
      $("#do-admin-search").click ->
        renderAdminSearchResults()
      $("#do-admin-add").click ->
        createNewTaxon()
      bindClickTargets()
      false
  catch e
    $("article").html("<div class='bs-callout bs-callout-danger'><h4>Application Error</h4><p>There was an error in the application. Please refresh and try again. If this persists, please contact administration.</p></div>")
  false


verifyLoginCredentials = (callback) ->
  ###
  # Checks the login credentials against the server.
  # This should not be used in place of sending authentication
  # information alongside a restricted action, as a malicious party
  # could force the local JS check to succeed.
  # SECURE AUTHENTICATION MUST BE WHOLLY SERVER SIDE.
  ###
  hash = $.cookie("ssarherps_auth")
  secret = $.cookie("ssarherps_secret")
  link = $.cookie("ssarherps_link")
  args = "hash=#{hash}&secret=#{secret}&dblink=#{link}"
  $.post(adminParams.loginApiTarget,args,"json")
  .done (result) ->
    if result.status is true
      callback(result)
    else
      goTo(result.login_url)
  .fail (result,status) ->
    # Throw up some warning here
    $("article").html("<div class='bs-callout-danger bs-callout'><h4>Couldn't verify login</h4><p>There's currently a server problem. Try back again soon.</p>'</div>")
    console.log(result,status)
    false
  false


renderAdminSearchResults = (containerSelector = "#search-results") ->
  ###
  # Takes parts of performSearch() but only in the admin context
  ###
  s = $("#admin-search").val()
  if isNull(s)
    toastStatusMessage("Please enter a search term")
    return false
  animateLoad()
  $("#admin-search").blur()
  # Remove periods from the search
  s = s.replace(/\./g,"")
  s = prepURI(s.toLowerCase())
  args = "q=#{s}&loose=true"
  # Also update the link
  b64s = Base64.encodeURI(s)
  newLink = "#{uri.urlString}##{b64s}"
  $("#app-linkout").attr("data-url",newLink)
  $.get(searchParams.targetApi,args,"json")
  .done (result) ->
    if result.status isnt true or result.count is 0
      stopLoadError()
      if isNull(result.human_error)
        toastStatusMessage("Your search returned no results. Please try again.")
      else
        toastStatusMessage(result.human_error)
      return false
    # Now, take the results and format them
    data = result.result
    html = ""
    htmlHead = "<table id='cndb-result-list' class='table table-striped table-hover'>\n\t<tr class='cndb-row-headers'>"
    htmlClose = "</table>"
    # We start at 0, so we want to count one below
    targetCount = toInt(result.count)-1
    colClass = null
    bootstrapColCount = 0
    $.each data, (i,row) ->
      if toInt(i) is 0
        j = 0
        htmlHead += "\n<!-- Table Headers - #{Object.size(row)} entries -->"
        $.each row, (k,v) ->
          niceKey = k.replace(/_/g," ")
          if k is "genus" or k is "species" or k is "subspecies"
            htmlHead += "\n\t\t<th class='text-center'>#{niceKey}</th>"
            bootstrapColCount++
          j++
          if j is Object.size(row)
            htmlHead += "\n\t\t<th class='text-center'>Edit</th>"
            bootstrapColCount++
            htmlHead += "\n\t\t<th class='text-center'>Delete</th>\n\t</tr>"
            bootstrapColCount++
            htmlHead += "\n<!-- End Table Headers -->"
            console.log("Got #{bootstrapColCount} display columns.")
            bootstrapColSize = roundNumber(12/bootstrapColCount,0)
            colClass = "col-md-#{bootstrapColSize}"
      taxonQuery = "#{row.genus.trim()}+#{row.species.trim()}"
      if not isNull(row.subspecies)
        taxonQuery = "#{taxonQuery}+#{row.subspecies.trim()}"
      htmlRow = "\n\t<tr id='cndb-row#{i}' class='cndb-result-entry' data-taxon=\"#{taxonQuery}\">"
      l = 0
      $.each row, (k,col) ->
        if isNull(row.genus)
          # Next iteration
          return true
        if k is "genus" or k is "species" or k is "subspecies"
          htmlRow += "\n\t\t<td id='#{k}-#{i}' class='#{k} #{colClass}'>#{col}</td>"
        l++
        if l is Object.size(row)
          htmlRow += "\n\t\t<td id='edit-#{i}' class='edit-taxon #{colClass} text-center'><paper-icon-button icon='image:edit' class='edit' data-taxon='#{taxonQuery}'></paper-icon-button></td>"
          htmlRow += "\n\t\t<td id='delete-#{i}' class='delete-taxon #{colClass} text-center'><paper-icon-button icon='delete' class='delete-taxon-button fadebg' data-taxon='#{taxonQuery}' data-database-id='#{row.id}'></paper-icon-button></td>"
          htmlRow += "\n\t</tr>"
          html += htmlRow
      if toInt(i) is targetCount
        html = htmlHead + html + htmlClose
        $(containerSelector).html(html)
        console.log("Processed #{toInt(i)+1} rows")
        $(".edit").click ->
          taxon = $(this).attr('data-taxon')
          lookupEditorSpecies(taxon)
        $(".delete-taxon-button").click ->
          taxon = $(this).attr('data-taxon')
          taxaId = $(this).attr('data-database-id')
          deleteTaxon(taxaId)
        stopLoad()
  .fail (result,status) ->
    console.error("There was an error performing the search")
    console.warn(result,error,result.statusText)
    error = "#{result.status} - #{result.statusText}"
    $("#search-status").attr("text","Couldn't execute the search - #{error}")
    $("#search-status")[0].show()
    stopLoadError()


loadModalTaxonEditor = (extraHtml = "", affirmativeText = "Save") ->
  ###
  # Load a modal taxon editor
  ###
  #  | <a href="#" "onclick='window.open(this.href); return false;' onkeypress='window.open(this.href); return false;'">Syntax Cheat Sheet</a>
  editHtml = """
  <paper-input label="Genus" id="edit-genus" name="edit-genus" class="genus" floatingLabel></paper-input>
  <paper-input label="Species" id="edit-species" name="edit-species" class="species" floatingLabel></paper-input>
  <paper-input label="Subspecies" id="edit-subspecies" name="edit-subspecies" class="subspecies" floatingLabel></paper-input>
  <paper-input label="Common Name" id="edit-common-name" name="edit-common-name"  class="common_name" floatingLabel></paper-input>
  <paper-input label="Deprecated Scientific Names" id="edit-deprecated-scientific" name="edit-depreated-scientific" floatingLabel aria-describedby="deprecatedHelp"></paper-input>
    <span class="help-block" id="deprecatedHelp">List names here in the form <span class="code">"Genus species":"Authority: year","Genus species":"Authority: year",[...]</span>.<br/>There should be no spaces between the quotes and comma or colon. If there are, it may not save correctly.</span>
  <paper-input label="Clade" class="capitalize" id="edit-major-type" name="edit-major-type" floatingLabel></paper-input>
  <paper-input label="Subtype" class="capitalize" id="edit-major-subtype" name="edit-major-subtype" floatingLabel></paper-input>
  <paper-input label="Minor clade / 'Family'" id="edit-minor-type" name="edit-minor-type" floatingLabel></paper-input>
  <paper-input label="Linnean Order" id="edit-linnean-order" name="edit-linnean-order" class="linnean_order" floatingLabel></paper-input>
  <paper-input label="Common Type (eg., 'lizard')" id="edit-major-common-type" name="edit-major-common-type" class="major_common_type" floatingLabel></paper-input>
  <paper-input label="Genus authority" id="edit-genus-authority" name="edit-genus-authority" class="genus_authority" floatingLabel></paper-input>
  <paper-input label="Genus authority year" id="edit-gauthyear" name="edit-gauthyear" floatingLabel></paper-input>
  <core-label>
    Use Parenthesis for Genus Authority
    <paper-toggle-button id="genus-authority-parens"  checked="false"></paper-toggle-button>
  </core-label>
  <paper-input label="Species authority" id="edit-species-authority" name="edit-species-authority" class="species_authority" floatingLabel></paper-input>
  <paper-input label="Species authority year" id="edit-sauthyear" name="edit-sauthyear" floatingLabel></paper-input>
  <core-label>
    Use Parenthesis for Species Authority
    <paper-toggle-button id="species-authority-parens" checked="false"></paper-toggle-button>
  </core-label>
  <br/><br/>
  <paper-autogrow-textarea id="edit-notes-autogrow" rows="5">
    <textarea placeholder="Notes" id="edit-notes" name="edit-notes" aria-describedby="notes-help" rows="5"></textarea>
  </paper-autogrow-textarea>
  <span class="help-block" id="notes-help">You can write your notes in Markdown. (<a href="https://daringfireball.net/projects/markdown/syntax" "onclick='window.open(this.href); return false;' onkeypress='window.open(this.href); return false;'">Official Full Syntax Guide</a>)</span>
  <paper-input label="Image" id="edit-image" name="edit-image" floatingLabel aria-describedby="imagehelp"></paper-input>
    <span class="help-block" id="imagehelp">The image path here should be relative to the <span class="code">public_html/cndb/</span> directory.</span>
  <paper-input label="Image Credit" id="edit-image-credit" name="edit-image-credit" floatingLabel></paper-input>
  <paper-input label="Image License" id="edit-image-license" name="edit-image-license" floatingLabel></paper-input>
  <paper-input label="Taxon Credit" id="edit-taxon-credit" name="edit-taxon-credit" floatingLabel aria-describedby="taxon-credit-help"></paper-input>
    <span class="help-block" id="taxon-credit-help">This will be displayed as "Taxon information by [your entry]."</span>
  <paper-input label="Taxon Credit Date" id="edit-taxon-credit-date" name="edit-taxon-credit-date" floatingLabel></paper-input>
  #{extraHtml}
  <input type="hidden" name="edit-taxon-author" id="edit-taxon-author" value="" />
  """
  html = """
  <paper-action-dialog backdrop layered autoCloseDisabled closeSelector="#close-editor" id='modal-taxon-edit'>
    <div id='modal-taxon-editor'>
      #{editHtml}
    </div>
    <paper-button id='close-editor' dismissive>Cancel</paper-button>
    <paper-button id='duplicate-taxon' dismissive>Duplicate</paper-button>
    <paper-button id='save-editor' affirmative>#{affirmativeText}</paper-button></paper-action-dialog>
  """
  if $("#modal-taxon-edit").exists()
    $("#modal-taxon-edit").remove()
  $("#search-results").after(html)
  # Bind the autogrow
  # See https://www.polymer-project.org/0.5/docs/elements/paper-autogrow-textarea.html
  try
    noteArea = $("html /deep/ #edit-notes").get(0)
    $("html /deep/ #edit-notes-autogrow").attr("target",noteArea)
  catch e
    try
      noteArea = $("html >>> #edit-notes").get(0)
      $("html >>> #edit-notes-autogrow").attr("target",noteArea)
    catch e
      try
        noteArea = $("#edit-notes").get(0)
        $("#edit-notes-autogrow").attr("target",noteArea)
      catch e
        console.error("Couldn't bind autogrow")
  # Reset the bindings
  $("#modal-taxon-edit").unbind()
  try
    $("html /deep/ #save-editor").unbind()
    $("html /deep/ #duplicate-taxon")
    .unbind()
    .click ->
      createDuplicateTaxon()
  catch e
    $("html >>> #save-editor").unbind()
    $("html >>> #duplicate-taxon")
    .unbind()
    .click ->
      createDuplicateTaxon()




createNewTaxon = ->
  ###
  # Load a blank modal taxon editor, ready to make a new one
  ###
  animateLoad()
  loadModalTaxonEditor("","Create")
  # REmove the dupliate button
  try
    $("html /deep/ #duplicate-taxon").remove()
  catch e
    $("html >>> #duplicate-taxon").remove()
  # Append the editor value
  whoEdited = if isNull($.cookie("ssarherps_fullname")) then $.cookie("ssarherps_user") else $.cookie("ssarherps_fullname")
  try
    $("html /deep/ #edit-taxon-author").attr("value",whoEdited)
  catch e
    $("html >>> #edit-taxon-author").attr("value",whoEdited)
  # Bind the save button
  try
    $("html /deep/ #save-editor")
    .click ->
      saveEditorEntry("new")
  catch e
    $("html >>> #save-editor")
    .click ->
      saveEditorEntry("new")
  $("#modal-taxon-edit")[0].open()
  stopLoad()

createDuplicateTaxon = ->
  ###
  # Accessed from an existing taxon modal editor.
  #
  # Remove the edited notes, remove the duplicate button, and change
  # the bidings so a new entry is created.
  ###
  animateLoad()
  try
    # Change the open editor ID value
    try
      $("html /deep/ #taxon-id").remove()
      $("html /deep/ #last-edited-by").remove()
      $("html /deep/ #duplicate-taxon").remove()
    catch e
      $("html >>> #taxon-id").remove()
      $("html >>> #last-edited-by").remove()
      $("html >>> #duplicate-taxon").remove()
    # Rebind the saves
    try
      $("html /deep/ #save-editor")
      .text("Create")
      .unbind()
      .click ->
        saveEditorEntry("new")
    catch e
      $("html >>> #save-editor")
      .text("Create")
      .unbind()
      .click ->
        saveEditorEntry("new")
    delay 250, ->
      stopLoad()
  catch e
    stopLoadError("Unable to duplicate taxon")
    console.error("Couldn't duplicate taxon! #{e.message}")
    try
      $("html /deep/ #modal-taxon-edit").get(0).close()
    catch e
      $("html >>> #modal-taxon-edit").get(0).close()
  false


lookupEditorSpecies = (taxon = undefined) ->
  ###
  # Lookup a given species and load it for editing
  # Has some hooks for badly formatted taxa.
  #
  # @param taxon a URL-encoded string for a taxon.
  ###
  if not taxon?
    return false
  animateLoad()
  lastEdited = """
    <p id="last-edited-by">
      Last edited by <span id="taxon-author-last" class="capitalize"></span>
    </p>
    <input type='hidden' name='taxon-id' id='taxon-id'/>
  """
  loadModalTaxonEditor(lastEdited)
  # Bind the save button
  d$("#save-editor")
  .click ->
    saveEditorEntry()
  existensial = d$("#last-edited-by").exists()
  unless existensial
    d$("#axon-credit-help").after(lastEdited)
  ###
  # After
  # https://github.com/tigerhawkvok/SSAR-species-database/issues/33 :
  #
  # Some entries have illegal scientific names. Fix them, and assume
  # the wrong ones are deprecated.
  #
  # Therefore, "Phrynosoma (Anota) platyrhinos"  should use
  # "Anota platyrhinos" as the real name and "Phrynosoma platyrhinos"
  # as the deprecated.
  ###
  replacementNames = undefined
  originalNames = undefined
  args = "q=#{taxon}"
  if taxon.search(/\(/) isnt -1
    originalNames =
      genus: ""
      species: ""
      subspecies: ""
    replacementNames =
      genus: ""
      species: ""
      subspecies: ""
    taxonArray = taxon.split("+")
    k = 0
    while k < taxonArray.length
      v = taxonArray[k]
      console.log("Checking '#{v}'")
      switch toInt(k)
        when 0
          genusArray = v.split("(")
          console.log("Looking at genus array",genusArray)
          originalNames.genus = genusArray[0].trim()
          replacementNames.genus = if genusArray[1]? then genusArray[1].trim()[... -1] else genusArray[0]
        when 1
          speciesArray = v.split("(")
          console.log("Looking at species array",speciesArray)
          originalNames.species = speciesArray[0].trim()
          replacementNames.species = if speciesArray[1]? then speciesArray[1].trim()[... -1] else speciesArray[0]
        when 2
          subspeciesArray = v.split("(")
          console.log("Looking at ssp array",subspeciesArray)
          originalNames.subspecies = subspeciesArray[0].trim()
          replacementNames.subspecies = if subspeciesArray[1]? then subspeciesArray[1].trim()[... -1] else subspeciesArray[0]
        else
          console.error("K value of '#{k}' didn't match 0,1,2!")
      taxonArray[k] = v.trim()
      k++
    taxon = "#{originalNames.genus}+#{originalNames.species}"
    unless isNull(originalNames.subspecies)
      taxon += originalNames.subspecies
    args = "q=#{taxon}&loose=true"
    console.warn("Bad name! Calculated out:")
    console.warn("Should be currently",replacementNames)
    console.warn("Was previously",originalNames)
    console.warn("Pinging with","#{uri.urlString}#{searchParams.targetApi}?q=#{taxon}")
  # The actual query! This is what populates the editor.
  # Look up the taxon, take the first result, and populate
  $.get(searchParams.targetApi,args,"json")
  .done (result) ->
    try
      # We'll always take the first result. They query should be
      # perfectly specific, so we want the closest match in case of
      # G. sp. vs. G. sp. ssp.
      data = result.result[0]
      unless data?
        stopLoadError("Sorry, there was a problem parsing the information for this taxon. If it persists, you may have to fix it manually.")
        console.error("No data returned for","#{searchParams.targetApi}?q=#{taxon}")
        return false
      # The deprecated_scientific object is a json-string. We wan to
      # have this as an object to work with down the road.
      try
        data.deprecated_scientific = JSON.parse(data.deprecated_scientific)
      catch e
        # Do nothing -- it's probably empty.
      # Above, we defined originalNames as undefined, and it only
      # became an object if things needed to be cleaned up.
      if originalNames?
        # We have replacements to perform
        toastStatusMessage("Bad information found. Please review and resave.")
        data.genus = replacementNames.genus
        data.species = replacementNames.species
        data.subspecies = replacementNames.subspecies
        unless typeof data.deprecated_scientific is "object"
          data.deprecated_scientific = new Object()
        speciesString = originalNames.species
        unless isNull(originalNames.subspecies)
          speciesString += " #{originalNames.subspecies}"
        data.deprecated_scientific["#{originalNames.genus.toTitleCase()} #{speciesString}"] = "AUTHORITY: YEAR"
      # We've finished cleaning up the data from the server, time to
      # actually populate the edior.
      $.each data, (col,d) ->
        # For each column, replace _ with - and prepend "edit"
        # This should be the selector
        try
          if typeof d is "string"
            # Clean up any strings that may have random spaces.
            d = d.trim()
        catch e
          # Do nothing -- probably numeric, and in any case we're no
          # worse than we started.
        if col is "id"
          $("#taxon-id").attr("value",d)
        if col is "authority_year"
          # Parse it out
          year = parseTaxonYear(d)
          $("#edit-gauthyear").attr("value",year.genus)
          $("#edit-sauthyear").attr("value",year.species)
        else if col is "parens_auth_genus" or col is "parens_auth_species"
          # Check the paper-toggle-button
          category = col.split("_").pop()
          d$("##{category}-authority-parens").polymerChecked(toInt(d).toBool())
        else if col is "taxon_author"
          if d is "null" or isNull(d)
            $("#last-edited-by").remove()
            console.warn("Removed #last-edited-by! Didn't have an author provided for column '#{col}', giving '#{d}'. It's probably the first edit to this taxon.")
          else
            d$("#taxon-author-last").text(d)
          whoEdited = if isNull($.cookie("ssarherps_fullname")) then $.cookie("ssarherps_user") else $.cookie("ssarherps_fullname")
          d$("#edit-taxon-author").attr("value",whoEdited)
        else
          fieldSelector = "#edit-#{col.replace(/_/g,"-")}"
          if col is "deprecated_scientific"
            # Create a "neat" string from it
            d = JSON.stringify(d).trim().replace(/\\/g,"")
            d = d.replace(/{/,"")
            d = d.replace(/}/,"")
            if d is '""'
              d = ""
          if col isnt "notes"
            d$(fieldSelector).attr("value",d)
          else
            d$(fieldSelector).text(d)
      # Update the autogrow
      # See https://www.polymer-project.org/0.5/docs/elements/paper-autogrow-textarea.html
      try
        noteArea = d$("#edit-notes").get(0)
        d$("#edit-notes-autogrow").get(0).update(noteArea)
      catch e
        # Having an error binding the update
        console.error("Couldn't update autogrow size. Possibly related to","https://github.com/Polymer/paper-input/issues/182")
      # Finally, open the editor
      $("#modal-taxon-edit")[0].open()
      stopLoad()
    catch e
      stopLoadError()
      toastStatusMessage("Unable to populate the editor for this taxon - #{e.message}")
  .fail (result,status) ->
    stopLoadError()
    toastStatusMessage("There was a server error populating this taxon. Please try again.")
  false

saveEditorEntry = (performMode = "save") ->
  ###
  # Send an editor state along with login credentials,
  # and report the save result back to the user
  ###
  # Make all the entries lowercase EXCEPT notes and taxon_credit.
  # Close it on a successful save
  examineIds = [
    "genus"
    "species"
    "subspecies"
    "common-name"
    "major-type"
    "major-common-type"
    "major-subtype"
    "minor-type"
    "linnean-order"
    "genus-authority"
    "species-authority"
    "notes"
    "image"
    "image-credit"
    "image-license"
    "taxon-author"
    "taxon-credit"
    "taxon-credit-date"
    ]
  saveObject = new Object()
  escapeCompletion = false
  try
    $("html /deep/ paper-input /deep/ paper-input-decorator").removeAttr("isinvalid")
  catch e
    $("html >>> paper-input-button >>> paper-input-decorator").removeAttr("isinvalid")
  ## Manual parses
  try
    # Authority year
    testAuthorityYear = (authYearDeepInputSelector, directYear = false) ->
      ###
      # Helper function!
      # Take in a deep element selector, then run it through match
      # patterns for the authority year.
      #
      # @param authYearDeepInputSelector -- Selector for a shadow DOM
      #          element, ideally a paper-input.
      ###
      if directYear
        yearString = authYearDeepInputSelector
      else
        yearString = d$(authYearDeepInputSelector).val()
      error = undefined
      linnaeusYear = 1707 # Linnaeus's birth year
      d = new Date()
      nextYear = d.getUTCFullYear() + 1 # So we can honestly say "between" and mean it
      # Authority date regex
      # From
      # https://github.com/tigerhawkvok/SSAR-species-database/issues/37
      #authorityRegex = /^\d{4}$|^\d{4} (\"|')\d{4}\1$/
      authorityRegex = /^[1-2][07-9]\d{2}$|^[1-2][07-9]\d{2} (\"|')[1-2][07-9]\d{2}\1$/
      unless isNumber(yearString) and linnaeusYear < yearString < nextYear
        unless authorityRegex.test(yearString)
          # It's definitely bad, we just need to decide how bad
          if yearString.search(" ") is -1
            error = "This must be a valid year between #{linnaeusYear} and #{nextYear}"
          else
            error = "Nonstandard years must be of the form: YYYY 'YYYY', eg, 1801 '1802'"
        else
          # It matches the regex, but fails the check
          # So, it may be valid, but we need to check
          if yearString.search(" ") is -1
            # It's a simple year, but fails the check.
            # Therefore, it's out of range.
            error = "This must be a valid year between #{linnaeusYear} and #{nextYear}"
          else
            # There's a space, so it's of format:
            #   1801 '1802'
            # So we need to parse that out for a valid year check
            # The format is otherwise assured by the regex
            years = yearString.split(" ")
            unless linnaeusYear < years[0] < nextYear
              error = "The first year must be a valid year between #{linnaeusYear} and #{nextYear}"
            altYear = years[1].replace(/(\"|')/g,"")
            unless linnaeusYear < altYear < nextYear
              error = "The second year must be a valid year between #{linnaeusYear} and #{nextYear}"
            # Now, for input consistency, replace single-quotes with
            # double-quotes
            yearString = yearString.replace(/'/g,'"')
      # If there were any error strings assigned, display an error.
      if error?
        escapeCompletion = true
        console.warn("#{authYearDeepInputSelector} failed its validity checks for #{yearString}!")
        unless directYear
          # Populate the paper-input errors
          try
            $("html /deep/ #{authYearDeepInputSelector} /deep/ paper-input-decorator")
            .attr("error",error)
            .attr("isinvalid","isinvalid")
          catch e
            $("html >>> #{authYearDeepInputSelector} >>> paper-input-decorator")
            .attr("error",error)
            .attr("isinvalid","isinvalid")
        else
          throw Error(error)
      # Return the value for assignment
      return yearString
    # Test and assign all in one go
    try
      gYear = testAuthorityYear("#edit-gauthyear")
      sYear = testAuthorityYear("#edit-sauthyear")
      console.log("Escape Completion State:",escapeCompletion)
    catch e
      console.error("Unable to parse authority year! #{e.message}")
      authYearString = ""
    auth = new Object()
    auth[gYear] = sYear
    authYearString = JSON.stringify(auth)
  catch e
    # Didn't work
    console.error("Failed to JSON parse the authority year - #{e.message}")
    authYearString = ""
  saveObject["authority_year"] = authYearString
  try
    dep = new Object()
    depS = d$("#edit-deprecated-scientific").val()
    unless isNull(depS)
      depA = depS.split('","')
      for k in depA
        item = k.split("\":\"")
        dep[item[0].replace(/"/g,"")] = item[1].replace(/"/g,"")
      # We now have an object representing the deprecated
      # scientific. Check the internal values.
      console.log("Validating",dep)
      for taxon, authority of dep
        # We're going to assume the taxon is right.
        # Check the authority.
        authorityA = authority.split(":")
        console.log("Testing #{authority}",authorityA)
        unless authorityA.length is 2
          throw Error("Authority string should have an authority and year seperated by a colon.")
        auth = authorityA[0].trim()
        trimmedYearString = authorityA[1].trim()
        if trimmedYearString.search(",") isnt -1
          throw Error("Looks like there may be an extra space, or forgotten \", near '#{trimmedYearString}'")
        year = testAuthorityYear(trimmedYearString,true)
        console.log("Validated",auth,year)
      # Stringify it for the database saving
      depString = JSON.stringify(dep)
      # Compare the pretty string against the input string. Let's be
      # sure they match.
      if depString.replace(/[{}]/g,"") isnt depS
        throw Error("Badly formatted entry - generated doesn't match read")
    else
      # We have an empty deprecated field
      depString = ""
  catch e
    console.error("Failed to parse the deprecated scientifics - #{e.message}. They may be empty.")
    depString = ""
    error = "#{e.message}. Check your formatting!"
    try
      $("html /deep/ #edit-deprecated-scientific /deep/ paper-input-decorator")
      .attr("error",error)
      .attr("isinvalid","isinvalid")
    catch e
      $("html >>> #edit-deprecated-scientific >>> paper-input-decorator")
      .attr("error",error)
      .attr("isinvalid","isinvalid")
    escapeCompletion = true
    completionErrorMessage = "There was a problem with your formatting for the deprecated scientifics. Please check it and try again."
  saveObject["deprecated_scientific"] = depString
  # For the rest of the items, iterate over and put on saveObject
  keepCase = [
    "notes"
    "taxon_credit"
    "image"
    "image_credit"
    "image_license"
    ]
  # List of IDs that can't be empty
  # Reserved use pending
  # https://github.com/jashkenas/coffeescript/issues/3594
  requiredNotEmpty = [
    "common-name"
    "major-type"
    "linnean-order"
    "genus-authority"
    "species-authority"
    ]
  unless isNull(d$("#edit-image").val())
    # We have an image, need a credit
    requiredNotEmpty.push("image-credit")
    requiredNotEmpty.push("image-license")
  unless isNull(d$("#edit-taxon-credit").val())
    # We have a taxon credit, need a date for it
    requiredNotEmpty.push("taxon-credit-date")
  $.each examineIds, (k,id) ->
    # console.log(k,id)
    try
      thisSelector = "html /deep/ #edit-#{id}"
      if isNull($(thisSelector)) then throw("Invalid Selector")
    catch e
      thisSelector = "html >>> #edit-#{id}"
    col = id.replace(/-/g,"_")
    val = $(thisSelector).val().trim()
    unless col in keepCase
      # We want these to be as literally typed, rather than
      # smart-formatted.
      # Deprecated scientifics are already taken care of.
      val = val.toLowerCase()
    ## Do the input validation
    switch id
      when "genus", "species", "subspecies"
        # Scientific name must be well-formed
        error = "This required field must have only letters"
        nullTest = if id is "genus" or id is "species" then isNull(val) else false
        if /[^A-Za-z]/m.test(val) or nullTest
          try
            $("html /deep/ #edit-#{id} /deep/ paper-input-decorator")
            .attr("error",error)
            .attr("isinvalid","isinvalid")
          catch e
            $("html >>> #edit-#{id} >>> paper-input-decorator")
            .attr("error",error)
            .attr("isinvalid","isinvalid")
          escapeCompletion = true
      when "common-name", "major-type", "linnean-order", "genus-authority", "species-authority"
        # I'd love to syntactically clean this up via the empty array
        # requiredNotEmpty above, but that's pending
        # https://github.com/jashkenas/coffeescript/issues/3594
        #
        # These must just exist
        error = "This cannot be empty"
        if isNull(val)
          try
            $("html /deep/ #edit-#{id} /deep/ paper-input-decorator")
            .attr("error",error)
            .attr("isinvalid","isinvalid")
          catch e
            $("html >>> #edit-#{id} >>> paper-input-decorator")
            .attr("error",error)
            .attr("isinvalid","isinvalid")
          escapeCompletion = true
      else
        if id in requiredNotEmpty
          selectorSample = "#edit-#{id}"
          spilloverError = "This must not be empty"
          # console.log("Checking '#{selectorSample}'")
          if selectorSample is "#edit-image-credit" or selectorSample is "#edit-image-license"
            # We have an image, need a credit
            spilloverError = "This cannot be empty if an image is provided"
          if selectorSample is "#edit-taxon-credit-date"
            # We have a taxon credit, need a date for it
            spilloverError = "If you have a taxon credit, it also needs a date"
          if isNull(val)
            try
              $("html /deep/ #edit-#{id} /deep/ paper-input-decorator")
              .attr("error",spilloverError)
              .attr("isinvalid","isinvalid")
            catch e
              $("html >>> #edit-#{id} >>> paper-input-decorator")
              .attr("error",spilloverError)
              .attr("isinvalid","isinvalid")
            escapeCompletion = true
    # Finally, tack it on to the saveObject
    saveObject[col] = val
  # We've ended the loop! Did we hit an escape condition?
  if escapeCompletion
    animateLoad()
    consoleError = completionErrorMessage ? "Bad characters in entry. Stopping ..."
    completionErrorMessage ?= "There was a problem with your entry. Please correct your entry and try again."
    stopLoadError(completionErrorMessage)
    console.error(consoleError)
    return false
  saveObject.id = d$("#taxon-id").val()
  # The parens checks
  saveObject.parens_auth_genus = d$("#genus-authority-parens").polymerChecked()
  saveObject.parens_auth_species = d$("#species-authority-parens").polymerChecked()
  if performMode is "save"
    unless isNumber(saveObject.id)
      animateLoad()
      stopLoadError("The system was unable to generate a valid taxon ID for this entry. Please see the console for more details.")
      console.error("Unable to get a valid, numeric taxon id! We got '#{saveObject.id}'.")
      console.warn("The total save object so far is:",saveObject)
      return false
  saveString = JSON.stringify(saveObject)
  s64 = Base64.encodeURI(saveString)
  if isNull(saveString) or isNull(s64)
    animateLoad()
    stopLoadError("The system was unable to parse this entry for the server. Please see the console for more details.")
    console.error("Unable to stringify the JSON!.")
    console.warn("The total save object so far is:",saveObject)
    console.warn("Got the output string",saveSring)
    console.warn("Sending b64 string",s64)
    return false
  hash = $.cookie("ssarherps_auth")
  secret = $.cookie("ssarherps_secret")
  link = $.cookie("ssarherps_link")
  userVerification = "hash=#{hash}&secret=#{secret}&dblink=#{link}"
  args = "perform=#{performMode}&#{userVerification}&data=#{s64}"
  console.log("Going to save",saveObject)
  console.log("Using mode '#{performMode}'")
  animateLoad()
  $.post(adminParams.apiTarget,args,"json")
  .done (result) ->
    if result.status is true
      console.log("Server returned",result)
      if escapeCompletion
        console.error("Warning! The item saved, even though it wasn't supposed to.")
        return false
      try
        $("html /deep/ #modal-taxon-edit")[0].close()
      catch e
        $("html >>> #modal-taxon-edit")[0].close()
      unless isNull($("#admin-search").val())
        renderAdminSearchResults()
      return false
    stopLoadError()
    toastStatusMessage(result.human_error)
    console.error(result.error)
    console.warn("Server returned",result)
    console.warn("We sent","#{uri.urlString}#{adminParams.apiTarget}?#{args}")
    return false
  .fail (result,status) ->
    stopLoadError("Failed to send the data to the server.")
    console.error("Server error! We sent","#{uri.urlString}#{adminParams.apiTarget}?#{args}")
    false


deleteTaxon = (taxaId) ->
  caller = $(".delete-taxon .delete-taxon-button[data-database-id='#{taxaId}']")
  taxonRaw = caller.attr("data-taxon").replace(/\+/g," ")
  taxon = taxonRaw.substr(0,1).toUpperCase() + taxonRaw.substr(1)
  unless caller.hasClass("extreme-danger")
    # Prevent a double-click
    window.deleteWatchTimer = Date.now()
    delay 300, ->
      delete window.deleteWatchTimer
    caller.addClass("extreme-danger")
    delay 7500, ->
      caller.removeClass("extreme-danger")
    toastStatusMessage("Click again to confirm deletion of #{taxon}")
    return false
  if window.deleteWatchTimer?
    # It has been less than 300 ms since delete was first tapped.
    # Deny it.
    diff = Date.now() - window.deleteWatchTimer
    console.warn("The taxon was asked to be deleted #{diff}ms after the confirmation was prompted. Rejecting ...")
    return false
  animateLoad()
  args = "perform=delete&id=#{taxaId}"
  $.post(adminParams.apiTarget,args,"json")
  .done (result) ->
    if result.status is true
      # Remove the visual row
      caller.parents("tr").remove()
      toastStatusMessage("#{taxon} with ID #{taxaId} has been removed from the database.")
      stopLoad()
    else
      stopLoadError()
      toastStatusMessage(result.human_error)
      console.error(result.error)
      console.warn(result)
    false
  .fail (result,status) ->
    stopLoadError()
    toastStatusMessage("Failed to communicate with the server.")
    false

handleDragDropImage = ->
  ###
  # Take a drag-and-dropped image, and save it out to the database.
  # If we trigger this, we need to disable #edit-image
  ###
  foo()

foo = ->
  toastStatusMessage("Sorry, this feature is not yet finished")
  stopLoad()
  false

$ ->
  if $("#next").exists()
    $("#next")
    .unbind()
    .click ->
      openTab(adminParams.adminPageUrl)
  # The rest of the onload for the admin has been moved to the core.coffee file.

# Basic inits
root = exports ? this

uri = new Object()
uri.o = $.url()
uri.urlString = uri.o.attr('protocol') + '://' + uri.o.attr('host')  + uri.o.attr("directory")
uri.query = uri.o.attr("fragment")

window.locationData = new Object()
locationData.params =
  enableHighAccuracy: true
locationData.last = undefined

isBool = (str) -> str is true or str is false

isEmpty = (str) -> not str or str.length is 0

isBlank = (str) -> not str or /^\s*$/.test(str)

isNull = (str) ->
  try
    if isEmpty(str) or isBlank(str) or not str?
      unless str is false or str is 0 then return true
  catch
  false

isJson = (str) ->
  if typeof str is 'object' then return true
  try
    JSON.parse(str)
    return true
  catch
  false

isNumber = (n) -> not isNaN(parseFloat(n)) and isFinite(n)

toFloat = (str) ->
  if not isNumber(str) or isNull(str) then return 0
  parseFloat(str)

toInt = (str) ->
  if not isNumber(str) or isNull(str) then return 0
  parseInt(str)



toObject = (array) ->
  rv = new Object()
  for index, element of array
    if element isnt undefined then rv[index] = element
  rv

String::toBool = -> @toString() is 'true'

Boolean::toBool = -> @toString() is 'true' # In case lazily tested

Number::toBool = -> @toString() is "1"

Object.size = (obj) ->
  size = 0
  size++ for key of obj when obj.hasOwnProperty(key)
  size

delay = (ms,f) -> setTimeout(f,ms)

roundNumber = (number,digits = 0) ->
  multiple = 10 ** digits
  Math.round(number * multiple) / multiple

jQuery.fn.exists = -> jQuery(this).length > 0

jQuery.fn.polymerSelected = (setSelected = undefined) ->
  # See
  # https://www.polymer-project.org/docs/elements/paper-elements.html#paper-dropdown-menu
  if setSelected?
    if not isBool(setSelected)
      try
        childDropdown = $(this).find("[valueattr]")
        if isNull(childDropdown)
          childDropdown = $(this)
        prop = childDropdown.attr("valueattr")
        # Find the element where the prop matches the selected
        item = $(this).find("[#{prop}=#{setSelected}]")
        index = item.index()
        item.parent().prop("selected",index)
      catch e
        return false
    else
      console.log("setSelected #{setSelected} is boolean")
      $(this).parent().children().removeAttribute("selected")
      $(this).parent().children().removeAttribute("active")
      $(this).parent().children().removeClass("core-selected")
      $(this).prop("selected",setSelected)
      $(this).prop("active",setSelected)
      if setSelected is true
        $(this).addClass("core-selected")
  else
    val = undefined
    try
      childDropdown = $(this).find("[valueattr]")
      if isNull(childDropdown)
        childDropdown = $(this)
      prop = childDropdown.attr("valueattr")
      val = $(this).find(".core-selected").attr(prop)
    catch e
      return false
    if val is "null" or not val?
      val = undefined
    val

jQuery.fn.polymerChecked = (setChecked = undefined) ->
  # See
  # https://www.polymer-project.org/docs/elements/paper-elements.html#paper-dropdown-menu
  if setChecked?
    jQuery(this).prop("checked",setChecked)
  else
    val = jQuery(this)[0].checked
    if val is "null" or not val?
      val = undefined
    val

jQuery.fn.isVisible = ->
  jQuery(this).css("display") isnt "none"

jQuery.fn.hasChildren = ->
  Object.size(jQuery(this).children()) > 3

byteCount = (s) => encodeURI(s).split(/%..|./).length - 1

`function shuffle(o) { //v1.0
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}`

randomInt = (lower = 0, upper = 1) ->
  start = Math.random()
  if not lower?
    [lower, upper] = [0, lower]
  if lower > upper
    [lower, upper] = [upper, lower]
  return Math.floor(start * (upper - lower + 1) + lower)


window.debounce_timer = null
debounce: (func, threshold = 300, execAsap = false) ->
  # Borrowed from http://coffeescriptcookbook.com/chapters/functions/debounce
  # Only run the prototyped function once per interval.
  (args...) ->
    obj = this
    delayed = ->
      func.apply(obj, args) unless execAsap
    if window.debounce_timer?
      clearTimeout(window.debounce_timer)
    else if (execAsap)
      func.apply(obj, args)
    window.debounce_timer = setTimeout(delayed, threshold)

Function::debounce = (threshold = 300, execAsap = false, timeout = window.debounce_timer, args...) ->
  # Borrowed from http://coffeescriptcookbook.com/chapters/functions/debounce
  # Only run the prototyped function once per interval.
  func = this
  delayed = ->
    func.apply(func, args) unless execAsap
    console.log("Debounce applied")
  if timeout?
    try
      clearTimeout(timeout)
    catch e
      # just do nothing
  else if execAsap
    func.apply(obj, args)
    console.log("Executed immediately")
  window.debounce_timer = setTimeout(delayed, threshold)


loadJS = (src, callback = new Object(), doCallbackOnError = true) ->
  ###
  # Load a new javascript file
  #
  # If it's already been loaded, jump straight to the callback
  #
  # @param string src The source URL of the file
  # @param function callback Function to execute after the script has
  #                          been loaded
  # @param bool doCallbackOnError Should the callback be executed if
  #                               loading the script produces an error?
  ###
  if $("script[src='#{src}']").exists()
    if typeof callback is "function"
      try
        callback()
      catch e
        console.error "Script is already loaded, but there was an error executing the callback function - #{e.message}"
    # Whether or not there was a callback, end the script
    return true
  # Create a new DOM selement
  s = document.createElement("script")
  # Set all the attributes. We can be a bit redundant about this
  s.setAttribute("src",src)
  s.setAttribute("async","async")
  s.setAttribute("type","text/javascript")
  s.src = src
  s.async = true
  # Onload function
  onLoadFunction = ->
    state = s.readyState
    try
      if not callback.done and (not state or /loaded|complete/.test(state))
        callback.done = true
        if typeof callback is "function"
          try
            callback()
          catch e
            console.error "Postload callback error - #{e.message}"
    catch e
      console.error "Onload error - #{e.message}"
  # Error function
  errorFunction = ->
    console.warn "There may have been a problem loading #{src}"
    try
      unless callback.done
        callback.done = true
        if typeof callback is "function" and doCallbackOnError
          try
            callback()
          catch e
            console.error "Post error callback error - #{e.message}"
    catch e
      console.error "There was an error in the error handler! #{e.message}"
  # Set the attributes
  s.setAttribute("onload",onLoadFunction)
  s.setAttribute("onreadystate",onLoadFunction)
  s.setAttribute("onerror",errorFunction)
  s.onload = s.onreadystate = onLoadFunction
  s.onerror = errorFunction
  document.getElementsByTagName('head')[0].appendChild(s)
  true


String::toTitleCase = ->
  # From http://stackoverflow.com/a/6475125/1877527
  str =
    @replace /([^\W_]+[^\s-]*) */g, (txt) ->
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()

  # Certain minor words should be left lowercase unless
  # they are the first or last words in the string
  lowers = [
    "A"
    "An"
    "The"
    "And"
    "But"
    "Or"
    "For"
    "Nor"
    "As"
    "At"
    "By"
    "For"
    "From"
    "In"
    "Into"
    "Near"
    "Of"
    "On"
    "Onto"
    "To"
    "With"
    ]
  for lower in lowers
    lowerRegEx = new RegExp("\\s#{lower}\\s","g")
    str = str.replace lowerRegEx, (txt) -> txt.toLowerCase()

  # Certain words such as initialisms or acronyms should be left
  # uppercase
  uppers = [
    "Id"
    "Tv"
    ]
  for upper in uppers
    upperRegEx = new RegExp("\\b#{upper}\\b","g")
    str = str.replace upperRegEx, upper.toUpperCase()
  str

mapNewWindows = (stopPropagation = true) ->
  # Do new windows
  $(".newwindow").each ->
    # Add a click and keypress listener to
    # open links with this class in a new window
    curHref = $(this).attr("href")
    if not curHref?
      # Support non-standard elements
      curHref = $(this).attr("data-href")
    openInNewWindow = (url) ->
      if not url? then return false
      window.open(url)
      return false
    $(this).click (e) ->
      if stopPropagation
        e.preventDefault()
        e.stopPropagation()
      openInNewWindow(curHref)
    $(this).keypress ->
      openInNewWindow(curHref)

# Animations

toastStatusMessage = (message, className = "", duration = 3000, selector = "#search-status") ->
  ###
  # Pop up a status message
  ###
  if not isNumber(duration)
    duration = 3000
  if selector.slice(0,1) is not "#"
    selector = "##{selector}"
  if not $(selector).exists()
    html = "<paper-toast id=\"#{selector.slice(1)}\" duration=\"#{duration}\"></paper-toast>"
    $(html).appendTo("body")
  $(selector).attr("text",message)
  $(selector).addClass(className)
  $(selector)[0].show()
  delay duration + 500, ->
    # A short time after it hides, clean it up
    $(selector).empty()
    $(selector).removeClass(className)
    $(selector).attr("text","")


openLink = (url) ->
  if not url? then return false
  window.open(url)
  false

openTab = (url) ->
  openLink(url)

goTo = (url) ->
  if not url? then return false
  window.location.href = url
  false

animateLoad = (elId = "loader") ->
  ###
  # Suggested CSS to go with this:
  #
  # #loader {
  #     position:fixed;
  #     top:50%;
  #     left:50%;
  # }
  # #loader.good::shadow .circle {
  #     border-color: rgba(46,190,17,0.9);
  # }
  # #loader.bad::shadow .circle {
  #     border-color:rgba(255,0,0,0.9);
  # }
  ###
  if isNumber(elId) then elId = "loader"
  if elId.slice(0,1) is "#"
    selector = elId
    elId = elId.slice(1)
  else
    selector = "##{elId}"
  try
    if not $(selector).exists()
      $("body").append("<paper-spinner id=\"#{elId}\" active></paper-spinner")
    else
      $(selector).attr("active",true)
    false
  catch e
    console.warn('Could not animate loader', e.message)

stopLoad = (elId = "loader", fadeOut = 1000) ->
  if elId.slice(0,1) is "#"
    selector = elId
    elId = elId.slice(1)
  else
    selector = "##{elId}"
  try
    if $(selector).exists()
      $(selector).addClass("good")
      delay fadeOut, ->
        $(selector).removeClass("good")
        $(selector).attr("active",false)
        $(selector).removeAttr("active")
  catch e
    console.warn('Could not stop load animation', e.message)


stopLoadError = (message, elId = "loader", fadeOut = 7500) ->
  if elId.slice(0,1) is "#"
    selector = elId
    elId = elId.slice(1)
  else
    selector = "##{elId}"
  try
    if $(selector).exists()
      $(selector).addClass("bad")
      if message? then toastStatusMessage(message,"",fadeOut)
      delay fadeOut, ->
        $(selector).removeClass("bad")
        $(selector).attr("active",false)
  catch e
    console.warn('Could not stop load error animation', e.message)



doCORSget = (url, args, callback = undefined, callbackFail = undefined) ->
  corsFail = ->
    if typeof callbackFail is "function"
      callbackFail()
    else
      throw new Error("There was an error performing the CORS request")
  # First try the jquery way
  settings =
    url: url
    data: args
    type: "get"
    crossDomain: true
  try
    $.ajax(settings)
    .done (result) ->
      if typeof callback is "function"
        callback()
        return false
    .fail (result,status) ->
      console.warn("Couldn't perform jQuery AJAX CORS. Attempting manually.")
  catch e
    console.warn("There was an error using jQuery to perform the CORS request. Attemping manually.")
  # Then try the long way
  url = "#{url}?#{args}"
  createCORSRequest = (method = "get", url) ->
    # From http://www.html5rocks.com/en/tutorials/cors/
    xhr = new XMLHttpRequest()
    if "withCredentials" of xhr
      # Check if the XMLHttpRequest object has a "withCredentials"
      # property.
      # "withCredentials" only exists on XMLHTTPRequest2 objects.
      xhr.open(method,url,true)
    else if typeof XDomainRequest isnt "undefined"
      # Otherwise, check if XDomainRequest.
      # XDomainRequest only exists in IE, and is IE's way of making CORS requests.
      xhr = new XDomainRequest()
      xhr.open(method,url)
    else
      xhr = null
    return xhr
  # Now execute it
  xhr = createCORSRequest("get",url)
  if !xhr
    throw new Error("CORS not supported")
  xhr.onload = ->
    response = xhr.responseText
    if typeof callback is "function"
      callback(response)
    return false
  xhr.onerror = ->
    console.warn("Couldn't do manual XMLHttp CORS request")
    # Place this in the last error
    corsFail()
  xhr.send()
  false



deepJQuery = (selector) ->
  ###
  # Do a shadow-piercing selector
  #
  # Cross-browser, works with Chrome, Firefox, Opera, Safari, and IE
  # Falls back to standard jQuery selector when everything fails.
  ###
  try
    # Chrome uses /deep/ which has been deprecated
    # See http://dev.w3.org/csswg/css-scoping/#deep-combinator
    # https://w3c.github.io/webcomponents/spec/shadow/#composed-trees
    # This is current as of Chrome 44.0.2391.0 dev-m
    # See https://code.google.com/p/chromium/issues/detail?id=446051
    unless $("html /deep/ #{selector}").exists()
      throw("Bad /deep/ selector")
    return $("html /deep/ #{selector}")
  catch e
    try
      # Firefox uses >>> instead of "deep"
      # https://developer.mozilla.org/en-US/docs/Web/Web_Components/Shadow_DOM
      # This is actually the correct selector
      unless $("html >>> #{selector}").exists()
        throw("Bad >>> selector")
      return $("html >>> #{selector}")
    catch e
      # These don't match at all -- do the normal jQuery selector
      return $(selector)



d$ = (selector) ->
  deepJQuery(selector)


lightboxImages = (selector = ".lightboximage", lookDeeply = false) ->
  ###
  # Lightbox images with this selector
  #
  # If the image has it, wrap it in an anchor and bind;
  # otherwise just apply to the selector.
  #
  # Plays nice with layzr.js
  # https://callmecavs.github.io/layzr.js/
  ###
  # The options!
  options =
      onStart: ->
        overlayOn()
      onEnd: ->
        overlayOff()
        activityIndicatorOff()
      onLoadStart: ->
        activityIndicatorOn()
      onLoadEnd: ->
        activityIndicatorOff()
      allowedTypes: 'png|jpg|jpeg|gif|bmp|webp'
      quitOnDocClick: true
      quitOnImgClick: true
  jqo = if lookDeeply then d$(selector) else $(selector)
  jqo
  .click (e) ->
    try
      $(this).imageLightbox(options).startImageLightbox()
      # We want to stop the events propogating up for these
      e.preventDefault()
      e.stopPropagation()
      console.warn("Event propagation was stopped when clicking on this.")
    catch e
      console.error("Unable to lightbox this image!")
  # Set up the items
  .each ->
    # console.log("Using selectors '#{selector}' / '#{this}' for lightboximages")
    try
      if $(this).prop("tagName").toLowerCase() is "img" and $(this).parent().prop("tagName").toLowerCase() isnt "a"
        tagHtml = $(this).removeClass("lightboximage").prop("outerHTML")
        imgUrl = switch
          when not isNull($(this).attr("data-layzr-retina"))
            $(this).attr("data-layzr-retina")
          when not isNull($(this).attr("data-layzr"))
            $(this).attr("data-layzr")
          else
            $(this).attr("src")
        $(this).replaceWith("<a href='#{imgUrl}' class='lightboximage'>#{tagHtml}</a>")
    catch e
      console.warn("Couldn't parse through the elements")




activityIndicatorOn = ->
  $('<div id="imagelightbox-loading"><div></div></div>' ).appendTo('body')
activityIndicatorOff = ->
  $('#imagelightbox-loading').remove()
  $("#imagelightbox-overlay").click ->
    # Clicking anywhere on the overlay clicks on the image
    # It loads too late to let the quitOnDocClick work
    $("#imagelightbox").click()
overlayOn = ->
  $('<div id="imagelightbox-overlay"></div>').appendTo('body')
overlayOff = ->
  $('#imagelightbox-overlay').remove()

formatScientificNames = (selector = ".sciname") ->
    $(".sciname").each ->
      # Is it italic?
      nameStyle = if $(this).css("font-style") is "italic" then "normal" else "italic"
      $(this).css("font-style",nameStyle)

prepURI = (string) ->
  string = encodeURIComponent(string)
  string.replace(/%20/g,"+")


getLocation = (callback = undefined) ->
  geoSuccess = (pos,callback) ->
    window.locationData.lat = pos.coords.latitude
    window.locationData.lng = pos.coords.longitude
    window.locationData.acc = pos.coords.accuracy
    window.locationData.last = Date.now() # ms, unix time
    if callback?
      callback(window.locationData)
    false
  geoFail = (error,callback) ->
    locationError = switch error.code
      when 0 then "There was an error while retrieving your location: #{error.message}"
      when 1 then "The user prevented this page from retrieving a location"
      when 2 then "The browser was unable to determine your location: #{error.message}"
      when 3 then "The browser timed out retrieving your location."
    console.error(locationError)
    if callback?
      callback(false)
    false
  if navigator.geolocation
    navigator.geolocation.getCurrentPosition(geoSuccess,geoFail,window.locationData.params)
  else
    console.warn("This browser doesn't support geolocation!")
    if callback?
      callback(false)

bindClickTargets = ->
  $(".click")
  .unbind()
  .click ->
    openTab($(this).attr("data-url"))

getMaxZ = ->
  mapFunction = ->
    $.map $("body *"), (e,n) ->
      if $(e).css("position") isnt "static"
        return parseInt $(e).css("z-index") or 1
  Math.max.apply null, mapFunction()

browserBeware = ->
  unless window.hasCheckedBrowser?
    window.hasCheckedBrowser = 0
  try
    browsers = new WhichBrowser()
    # Firefox general buggieness
    if browsers.isBrowser("Firefox")
      warnBrowserHtml = """
      <div id="firefox-warning" class="alert alert-warning alert-dismissible fade in" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <strong>Warning!</strong> Firefox has buggy support for <a href="http://webcomponents.org/" class="alert-link">webcomponents</a> and the <a href="https://www.polymer-project.org" class="alert-link">Polymer project</a>. If you encounter bugs, try using Chrome (recommended), Opera, Safari, Internet Explorer, or your phone instead &#8212; they'll all be faster, too.
      </div>
      """
      $("#title").after(warnBrowserHtml)
      # Firefox doesn't auto-initalize the dismissable
      $(".alert").alert()
      console.warn("We've noticed you're using Firefox. Firefox has problems with this site, we recommend trying Google Chrome instead:","https://www.google.com/chrome/")
      console.warn("Firefox took #{window.hasCheckedBrowser * 250}ms after page load to render this error message.")
    # Fix the collapse behaviour in IE
    if browsers.isBrowser("Internet Explorer")
      $("#collapse-button").click ->
        $(".collapse").collapse("toggle")

  catch e
    if window.hasCheckedBrowser is 100
      # We've waited almost 15 seconds
      console.warn("We can't check your browser! If you're using Firefox, beware of bugs!")
      return false
    delay 250, ->
      window.hasCheckedBrowser++
      browserBeware()


checkFileVersion = (forceNow = false) ->
  ###
  # Check to see if the file on the server is up-to-date with what the
  # user sees.
  #
  # @param bool forceNow force a check now 
  ###
  checkVersion = ->
    $.get("#{uri.urlString}meta.php","do=get_last_mod","json")
    .done (result) ->
      if forceNow
        console.log("Forced version check:",result)
      unless isNumber result.last_mod
        return false
      unless ssar.lastMod?
        ssar.lastMod = result.last_mod
      if result.last_mod > ssar.lastMod
        # File has updated
        html = """
        <div id="outdated-warning" class="alert alert-info alert-dismissible fade in" role="alert">
          <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
          <strong>We have page updates!</strong> This page has been updated since you last refreshed. <a class="alert-link" id="refresh-page">Click here to refresh now</a> and get bugfixes and updates.
        </div>
        """
        unless $("#outdated-warning").exists()
          $("body").append(html)
          $("#refresh-page").click ->
            document.location.reload(true)
        console.warn("Your current version is out of date! Please refresh the page.")
      else if forceNow
        console.log("Your version is up to date: have #{ssar.lastMod}, got #{result.last_mod}")
    .fail ->
      console.warn("Couldn't check file version!!")
    .always ->
      checkFileVersion()
  delay 5*60*1000, ->
    # Delay 5 minutes
    checkVersion()
  if forceNow or not ssar.lastMod?
    checkVersion()
    return true
  false

$ ->
  bindClickTargets()
  formatScientificNames()
  try
    $('[data-toggle="tooltip"]').tooltip()
  catch e
    console.warn("Tooltips were attempted to be set up, but do not exist")
  try
    checkAdmin()
    if adminParams.loadAdminUi is true
      loadAdminUi()
  catch e
    # If we're not in admin, get the location
    getLocation()
  browserBeware()
  checkFileVersion()

searchParams = new Object()
searchParams.targetApi = "commonnames_api.php"
searchParams.targetContainer = "#result_container"
searchParams.apiPath = uri.urlString + searchParams.targetApi

ssar = new Object()
# Base query URLs for out-of-site linkouts
ssar.affiliateQueryUrl =
  # As of 2015.05.24, no SSL connection
  amphibiaWeb: "http://amphibiaweb.org/cgi/amphib_query"
  # As of 2015.05.24, no SSL connection
  reptileDatabase: "http://reptile-database.reptarium.cz/species"
  # As of 2015.05.24, no SSL connection
  calPhotos: "http://calphotos.berkeley.edu/cgi/img_query"
  # As of 2015.05.24, the SSL cert is only for www.inaturalist.org
  iNaturalist: "https://www.inaturalist.org/taxa/search"


performSearch = (stateArgs = undefined) ->
  ###
  # Check the fields and filters and do the async search
  ###
  if not stateArgs?
    # No arguments have been passed in
    s = $("#search").val()
    # Store a version before we do any search modifiers
    sOrig = s
    s = s.toLowerCase()
    filters = getFilters()
    if (isNull(s) or not s?) and isNull(filters)
      $("#search-status").attr("text","Please enter a search term.")
      $("#search-status")[0].show()
      return false
    $("#search").blur()
    # Remove periods from the search
    s = s.replace(/\./g,"")
    s = prepURI(s)
    if $("#loose").polymerChecked()
      s = "#{s}&loose=true"
    if $("#fuzzy").polymerChecked()
      s = "#{s}&fuzzy=true"
    # Add on the filters
    if not isNull(filters)
      console.log("Got filters - #{filters}")
      s = "#{s}&filter=#{filters}"
    args = "q=#{s}"
  else
    # An argument has been passed in
    if stateArgs is true
      # Special case -- do a search on everything
      args = "q="
      sOrig = "(all items)"
    else
      # Do the search exactly as passed. The fragment should ALREADY
      # be decoded at this point.
      args = "q=#{stateArgs}"
      sOrig = stateArgs.split("&")[0]
    console.log("Searching on #{stateArgs}")
  if s is "#" or (isNull(s) and isNull(args)) or (args is "q=" and stateArgs isnt true)
    return false
  animateLoad()
  # console.log("Got search value #{s}, hitting","#{searchParams.apiPath}?#{args}")
  $.get(searchParams.targetApi,args,"json")
  .done (result) ->
    # Populate the result container
    # console.log("Search executed by #{result.method} with #{result.count} results.")
    if toInt(result.count) is 0
      if result.status is true
        if result.query_params.filter.had_filter is true
          filterText = ""
          i = 0
          $.each result.query_params.filter.filter_params, (col,val) ->
            if col isnt "BOOLEAN_TYPE"
              if i isnt 0
                filterText = "#{filter_text} #{result.filter.filter_params.BOOLEAN_TYPE}"
              filterText = "#{filterText} #{col.replace(/_/g," ")} is #{val}"
          text = "\"#{sOrig}\" where #{filterText} returned no results."
        else
          text = "\"#{sOrig}\" returned no results."
      else
        text = result.human_error
      clearSearch(true)
      $("#search-status").attr("text",text)
      $("#search-status")[0].show()
      stopLoadError()
      return false
    if result.status is true
      formatSearchResults(result)
      return false
    clearSearch(true)
    $("#search-status").attr("text",result.human_error)
    $("#search-status")[0].show()
    console.error(result.error)
    console.warn(result)
    stopLoadError()
  .fail (result,error) ->
    console.error("There was an error performing the search")
    console.warn(result,error,result.statusText)
    error = "#{result.status} - #{result.statusText}"
    # It probably doesn't make sense to clear the search on a bad
    # server call ...
    # clearSearch(true)
    $("#search-status").attr("text","Couldn't execute the search - #{error}")
    $("#search-status")[0].show()
    stopLoadError()
  .always ->
    # Anything we always want done
    b64s = Base64.encodeURI(s)
    if s? then setHistory("#{uri.urlString}##{b64s}")
    false

getFilters = (selector = ".cndb-filter",booleanType = "AND") ->
  ###
  # Look at $(selector) and apply the filters as per
  # https://github.com/tigerhawkvok/SSAR-species-database#search-flags
  # It's meant to work with Polymer dropdowns, but it'll fall back to <select><option>
  ###
  filterList = new Object()
  $(selector).each ->
    col = $(this).attr("data-column")
    if not col?
      # Skip this iteration
      return true
    val = $(this).polymerSelected()
    if val is "any" or val is "all" or val is "*"
      # Wildcard filter -- just don't give anything
      # Go to the next iteration
      return true
    if isNull(val) or val is false
      val = $(this).val()
      if isNull(val)
        # Skip this iteration
        return true
      else
    filterList[col] = val.toLowerCase()
  if Object.size(filterList) is 0
    # Pass back an empty string
    # console.log("Got back an empty filter list.")
    return ""
  try
    filterList["BOOLEAN_TYPE"] = booleanType
    jsonString = JSON.stringify(filterList)
    encodedFilter = Base64.encodeURI(jsonString)
    # console.log("Returning #{encodedFilter} from",filterList)
    return encodedFilter
  catch e
    return false


formatSearchResults = (result,container = searchParams.targetContainer) ->
  ###
  # Take a result object from the server's lookup, and format it to
  # display search results.
  # See
  # http://ssarherps.org/cndb/commonnames_api.php?q=batrachoseps+attenuatus&loose=true
  # for a sample search result return.
  ###
  data = result.result
  searchParams.result = data
  headers = new Array()
  html = ""
  htmlHead = "<table id='cndb-result-list' class='table table-striped table-hover'>\n\t<tr class='cndb-row-headers'>"
  htmlClose = "</table>"
  # We start at 0, so we want to count one below
  targetCount = toInt(result.count)-1
  colClass = null
  bootstrapColCount = 0
  dontShowColumns = [
    "id"
    "minor_type"
    "notes"
    "major_type"
    "taxon_author"
    "taxon_credit"
    "image_license"
    "image_credit"
    "taxon_credit_date"
    "parens_auth_genus"
    "parens_auth_species"
    ]
  externalCounter = 0
  renderTimeout = delay 5000, ->
    stopLoadError("There was a problem parsing the search results.")
    console.error("Couldn't finish parsing the results! Expecting #{targetCount} elements, timed out on #{externalCounter}.")
    console.warn(data)
    return false
  $.each data, (i,row) ->
    externalCounter = i
    if toInt(i) is 0
      j = 0
      htmlHead += "\n<!-- Table Headers - #{Object.size(row)} entries -->"
      $.each row, (k,v) ->
        niceKey = k.replace(/_/g," ")
        unless k in dontShowColumns
          # or niceKey is "image" ...
          if $("#show-deprecated").polymerSelected() isnt true
            alt = "deprecated_scientific"
          else
            # Empty placeholder
            alt = ""
          if k isnt alt
            # Remap names that were changed late into dev
            # See
            # https://github.com/tigerhawkvok/SSAR-species-database/issues/19
            # as an example
            niceKey = switch niceKey
              when "common name" then "english name"
              when "major subtype" then "english subtype"
              else niceKey
            htmlHead += "\n\t\t<th class='text-center'>#{niceKey}</th>"
            bootstrapColCount++
        j++
        if j is Object.size(row)
          htmlHead += "\n\t</tr>"
          htmlHead += "\n<!-- End Table Headers -->"
          # console.log("Got #{bootstrapColCount} display columns.")
          bootstrapColSize = roundNumber(12/bootstrapColCount,0)
          colClass = "col-md-#{bootstrapColSize}"
    taxonQuery = "#{row.genus}+#{row.species}"
    if not isNull(row.subspecies)
      taxonQuery = "#{taxonQuery}+#{row.subspecies}"
    htmlRow = "\n\t<tr id='cndb-row#{i}' class='cndb-result-entry' data-taxon=\"#{taxonQuery}\">"
    l = 0
    $.each row, (k,col) ->
      unless k in dontShowColumns
        if k is "authority_year"
          try
            try
              d = JSON.parse(col)
            catch e
              # attempt to fix it
              console.warn("There was an error parsing '#{col}', attempting to fix - ",e.message)
              split = col.split(":")
              year = split[1].slice(split[1].search("\"")+1,-2)
              console.log("Examining #{year}")
              year = year.replace(/"/g,"'")
              split[1] = "\"#{year}\"}"
              col = split.join(":")
              console.log("Reconstructed #{col}")
              d = JSON.parse(col)
            genus = Object.keys(d)[0]
            species = d[genus]
            col = "G: #{genus}<br/>S: #{species}"
          catch e
            # Render as-is
            console.error("There was an error parsing '#{col}'",e.message)
            d = col
        if $("#show-deprecated").polymerSelected() isnt true
          alt = "deprecated_scientific"
        else
          # Empty placeholder
          alt = ""
        if k isnt alt
          if k is "image"
            # Set up the images
            if isNull(col)
              # Get a CalPhotos link as
              # http://calphotos.berkeley.edu/cgi/img_query?rel-taxon=contains&where-taxon=batrachoseps+attenuatus
              col = "<paper-icon-button icon='launch' data-href='#{ssar.affiliateQueryUrl.calPhotos}?rel-taxon=contains&where-taxon=#{taxonQuery}' class='newwindow calphoto click' data-taxon=\"#{taxonQuery}\"></paper-icon-button>"
            else
              col = "<paper-icon-button icon='image:image' data-lightbox='#{uri.urlString}#{col}' class='lightboximage'></paper-icon-button>"
          # What should be centered, and what should be left-aligned?
          if k isnt "genus" and k isnt "species" and k isnt "subspecies"
            kClass = "#{k} text-center"
          else
            # Left-aligned
            kClass = k
          if k is "genus_authority" or k is "species_authority"
            kClass += " authority"
          htmlRow += "\n\t\t<td id='#{k}-#{i}' class='#{kClass} #{colClass}'>#{col}</td>"
      l++
      if l is Object.size(row)
        htmlRow += "\n\t</tr>"
        html += htmlRow
    # Check if we're done
    if toInt(i) is targetCount
      html = htmlHead + html + htmlClose
      # console.log("Processed #{toInt(i)+1} rows")
      $(container).html(html)
      clearTimeout(renderTimeout)
      mapNewWindows()
      lightboxImages()
      modalTaxon()
      doFontExceptions()
      $("#result-count").text(" - #{result.count} entries")
      insertCORSWorkaround()
      stopLoad()



parseTaxonYear = (taxonYearString,strict = true) ->
  ###
  # Take the (theoretically nicely JSON-encoded) taxon year/authority
  # string and turn it into a canonical object for the modal dialog to use
  ###
  try
    d = JSON.parse(taxonYearString)
  catch e
    # attempt to fix it
    console.warn("There was an error parsing '#{taxonYearString}', attempting to fix - ",e.message)
    split = taxonYearString.split(":")
    year = split[1].slice(split[1].search('"')+1,-2)
    console.log("Examining #{year}")
    year = year.replace(/"/g,"'")
    split[1] = "\"#{year}\"}"
    taxonYearString = split.join(":")
    console.log("Reconstructed #{taxonYearString}")
    try
      d = JSON.parse(taxonYearString)
    catch e
      if strict
        return false
      else
        return taxonYearString
  genus = Object.keys(d)[0]
  species = d[genus]
  year = new Object()
  year.genus = genus
  year.species = species
  return year

checkTaxonNear = (taxonQuery = undefined, callback = undefined, selector = "#near-me-container") ->
  ###
  # Check the iNaturalist API to see if the taxon is in your county
  # See https://github.com/tigerhawkvok/SSAR-species-database/issues/7
  ###
  if not taxonQuery?
    console.warn("Please specify a taxon.")
    return false;
  if not locationData.last?
    getLocation()
  elapsed = (Date.now() - locationData.last)/1000
  if elapsed > 15*60 # 15 minutes
    getLocation()
  # Now actually check
  apiUrl = "http://www.inaturalist.org/places.json"
  args = "taxon=#{taxonQuery}&latitude=#{locationData.lat}&longitude=#{locationData.lng}&place_type=county"
  geoIcon = ""
  cssClass = ""
  tooltipHint = ""
  $.get(apiUrl,args,"json")
  .done (result) ->
    if Object.size(result) > 0
      geoIcon = "communication:location-on"
      cssClass = "good-location"
      tooltipHint = "This species occurs in your county"
    else
      geoIcon = "communication:location-off"
      cssClass = "bad-location"
      tooltipHint = "This species does not occur in your county"
  .fail (result,status) ->
    cssClass = "bad-location"
    geoIcon = "warning"
    tooltipHint = "We couldn't determine your location"
  .always ->
    tooltipHtml = """
    <div class="tooltip fade top in right" role="tooltip" style="top: 6.5em; left: 4em; right:initial; display:none" id="manual-location-tooltip">
      <div class="tooltip-arrow" style="top:50%;left:5px"></div>
      <div class="tooltip-inner">#{tooltipHint}</div>
    </div>
    """
    try
      $("html /deep/ #{selector}").html("<core-icon icon='#{geoIcon}' class='small-icon #{cssClass} near-me' data-toggle='tooltip' id='near-me-icon'></core-icon>")
      $("html /deep/ #near-me-container")
      .after(tooltipHtml)
      .mouseenter ->
        $("html /deep/ #manual-location-tooltip").css("display","block")
        false
      .mouseleave ->
        $("html /deep/ #manual-location-tooltip").css("display","none")
        false
      #$("html /deep/ .near-me").tooltip()
    catch e
      $("html >>> #{selector}").html("<core-icon icon='#{geoIcon}' class='small-icon #{cssClass} near-me' data-toggle='tooltip' id='near-me-icon'></core-icon>")
      $("html >>> #near-me-container")
      .after(tooltipHtml)
      .mouseenter ->
        $("html >>> #manual-location-tooltip").css("display","block")
        false
      .mouseleave ->
        $("html >>> #manual-location-tooltip").css("display","none")
        false
      #$("html >>> .near-me").tooltip()
      try
        # Attempt to do this without looking through the shadow DOM
        $(selector).html("<core-icon icon='#{geoIcon}' class='small-icon #{cssClass}' data-toggle='tooltip' id='near-me-icon'></core-icon>")
        $("#near-me-container")
        .after(tooltipHtml)
        .mouseenter ->
          $("#manual-location-tooltip").css("display","block")
          false
        .mouseleave ->
          $("#manual-location-tooltip").css("display","none")
          false
        #$(".near-me").tooltip()
      catch e
        console.warn("Fallback failed to draw contents on the <paper-action-dialog>")
    if callback?
      callback()
  false



insertModalImage = (imageObject = ssar.taxonImage, taxon = ssar.activeTaxon, callback = undefined) ->
  ###
  # Insert into the taxon modal a lightboxable photo. If none exists,
  # load from CalPhotos
  #
  # CalPhotos functionality blocked on
  # https://github.com/tigerhawkvok/SSAR-species-database/issues/30
  ###
  # Is the modal dialog open?
  unless taxon?
    console.error("Tried to insert a modal image, but no taxon was provided!")
    return false
  unless typeof taxon is "object"
    console.error("Invalid taxon data type (expecting object), got #{typeof taxon}")
    warnArgs =
      taxon: taxon
      imageUrl: imageUrl
      defaultTaxon: ssar.activeTaxon
      defaultImage: ssar.taxonImage
    console.warn(warnArgs)
    return false
  # Image insertion helper
  insertImage = (image, taxonQueryString, classPrefix = "calphoto") ->
    ###
    # Insert a lightboxed image into the modal taxon dialog. This must
    # be shadow-piercing, since the modal dialog is a
    # paper-action-dialog.
    #
    # @param image an object with parameters [thumbUri, imageUri,
    #   imageLicense, imageCredit], and optionally imageLinkUri
    ###
    # Build individual args from object
    thumbnail = image.thumbUri
    largeImg = image.imageUri
    largeImgLink = image.imageLinkUri? image.imageUri
    imgLicense = image.imageLicense
    imgCredit = image.imageCredit
    html = """
    <div class="modal-img-container">
      <a href="#{largeImg}" class="#{classPrefix}-img-anchor center-block text-center">
        <img src="#{thumbnail}"
          data-href="#{largeImgLink}"
          class="#{classPrefix}-img-thumb"
          data-taxon="#{taxonQueryString}" />
      </a>
      <p class="small text-muted text-center">
        Image by #{imgCredit} under #{imgLicense}
      </p>
    </div>
    """
    d$("#meta-taxon-info").before(html)
    try
      # Call lightboxImages with the second argument "true" to do a
      # shadow-piercing lookup
      lightboxImages(".#{classPrefix}-img-anchor", true)
    catch e
      console.error("Error lightboxing images")
    if typeof callback is "function"
      callback()
    false
  # Now that that's out of the way, we actually check the information
  # and process it
  taxonArray = [taxon.genus,taxon.species]
  if taxon.subspecies?
    taxonArray.push(taxon.subspecies)
  taxonString = taxonArray.join("+")

  if imageObject.imageUri?
    # The image URI is valid, so insert it
    if typeof imageObject is "string"
      # Make it conform to expectations
      imageUrl = imageObject
      imageObject = new Object()
      imageObject.imageUri = imageUrl
    # Construct the thumb URI from the provided full-sized path
    imgArray = imageObject.imageUri.split(".")
    extension = imgArray.pop()
    # In case the uploaded file has "." in it's name, we want to re-join
    imgPath = imgArray.join(".")
    imageObject.thumbUri = "#{uri.urlString}#{imgPath}-thumb.#{extension}"
    imageObject.imageUri = "#{uri.urlString}#{imgPath}.#{extension}"
    # And finally, call our helper function
    insertImage(imageObject, taxonString, "ssarimg")
    return false
  ###
  # OK, we don't have it, do CalPhotos
  #
  # Hit targets of form
  # http://calphotos.berkeley.edu/cgi-bin/img_query?getthumbinfo=1&num=all&taxon=Acris+crepitans&format=xml
  #
  # See
  # http://calphotos.berkeley.edu/thumblink.html
  # for API reference.
  ###
  args = "getthumbinfo=1&num=all&cconly=1&taxon=#{taxonString}&format=xml"
  # console.log("Looking at","#{ssar.affiliateQueryUrl.calPhotos}?#{args}")
  ## CalPhotos doesn't have good headers set up. Try a CORS request.
  # CORS success callback
  doneCORS = (resultXml) ->
    result = xmlToJSON.parseString(resultXml)
    window.testData = result
    data = result.calphotos[0]
    unless data?
      console.warn("CalPhotos didn't return any valid images for this search!")
      return false
    imageObject = new Object()
    try
      imageObject.thumbUri = data.thumb_url[0]["_text"]
      unless imageObject.thumbUri?
        console.warn("CalPhotos didn't return any valid images for this search!")
        return false
      imageObject.imageUri = data.enlarge_jpeg_url[0]["_text"]
      imageObject.imageLinkUri = data.enlarge_url[0]["_text"]
      imageObject.imageLicense = data.license[0]["_text"]
      imageObject.imageCredit = "#{data.copyright[0]["_text"]} (via CalPhotos)"
    catch e
      console.warn("CalPhotos didn't return any valid images for this search!","#{ssar.affiliateQueryUrl.calPhotos}?#{args}")
      return false
    # Do the image insertion via our helper function
    insertImage(imageObject,taxonString)
    false
  # CORS failure callback
  failCORS = (result,status) ->
    console.error("Couldn't load a CalPhotos image to insert!")
    false
  # The actual call attempts.
  try
    doCORSget(ssar.affiliateQueryUrl.calPhotos, args, doneCORS, failCORS)
  catch e
    console.error(e.message)
  false


modalTaxon = (taxon = undefined) ->
  ###
  # Pop up the modal taxon dialog for a given species
  ###
  if not taxon?
    # If we have no taxon defined at all, bind all the result entries
    # from a search into popping one of these up
    $(".cndb-result-entry").click ->
      modalTaxon($(this).attr("data-taxon"))
    return false
  # Pop open a paper action dialog ...
  # https://www.polymer-project.org/docs/elements/paper-elements.html#paper-action-dialog
  animateLoad()
  if not $("#modal-taxon").exists()
    # On very small devices, for both real-estate and
    # optimization-related reasons, we'll hide calphotos and the alternate
    html = """
    <paper-action-dialog backdrop layered closeSelector="[affirmative]" id='modal-taxon'>
      <div id='modal-taxon-content'></div>
      <paper-button dismissive id='modal-inat-linkout'>iNaturalist</paper-button>
      <paper-button dismissive id='modal-calphotos-linkout' class="hidden-xs">CalPhotos</paper-button>
      <paper-button dismissive id='modal-alt-linkout' class="hidden-xs"></paper-button>
      <paper-button affirmative autofocus>Close</paper-button>
    </paper-action-dialog>
    """
    $("#result_container").after(html)
  $.get(searchParams.targetApi,"q=#{taxon}","json")
  .done (result) ->
    data = result.result[0]
    unless data?
      toastStatusMessage("There was an error fetching the entry details. Please try again later.")
      stopLoadError()
      return false
    # console.log("Got",data)
    year = parseTaxonYear(data.authority_year)
    yearHtml = ""
    if year isnt false
      genusAuthBlock = """
      <span class='genus_authority authority'>#{data.genus_authority}</span> #{year.genus}
      """
      speciesAuthBlock = """
      <span class='species_authority authority'>#{data.species_authority}</span> #{year.species}
      """
      if toInt(data.parens_auth_genus).toBool()
        genusAuthBlock = "(#{genusAuthBlock})"
      if toInt(data.parens_auth_species).toBool()
        speciesAuthBlock = "(#{speciesAuthBlock})"
      yearHtml = """
      <div id='near-me-container' data-toggle='tooltip' data-placement='top' title='' class='near-me'></div>
      <p>
        <span class='genus'>#{data.genus}</span>,
        #{genusAuthBlock};
        <span class='species'>#{data.species}</span>,
        #{speciesAuthBlock}
      </p>
      """
    deprecatedHtml = ""
    if not isNull(data.deprecated_scientific)
      deprecatedHtml = "<p>Deprecated names: "
      try
        sn = JSON.parse(data.deprecated_scientific)
        i = 0
        $.each sn, (scientific,authority) ->
          i++
          if i isnt 1
            deprecatedHtml += "; "
          deprecatedHtml += "<span class='sciname'>#{scientific}</span>, #{authority}"
          if i is Object.size(sn)
            deprecatedHtml += "</p>"
      catch e
        # skip it
        deprecatedHtml = ""
        console.error("There were deprecated scientific names, but the JSON was malformed.")
    minorTypeHtml = ""
    if not isNull(data.minor_type)
      minorTypeHtml = " <core-icon icon='arrow-forward'></core-icon> <span id='taxon-minor-type'>#{data.minor_type}</span>"
    # Populate the taxon
    if isNull(data.notes)
      data.notes = "Sorry, we have no notes on this taxon yet."
      data.taxon_credit = ""
    else
      if isNull(data.taxon_credit) or data.taxon_credit is "null"
        data.taxon_credit = "This taxon information is uncredited."
      else
        taxonCreditDate = if isNull(data.taxon_credit_date) or data.taxon_credit_date is "null" then "" else " (#{data.taxon_credit_date})"
        data.taxon_credit = "Taxon information by #{data.taxon_credit}.#{taxonCreditDate}"
    try
      notes = markdown.toHTML(data.notes)
    catch e
      notes = data.notes
      console.warn("Couldn't parse markdown!! #{e.message}")
    commonType = unless isNull(data.major_common_type) then " (<span id='taxon-common-type'>#{data.major_common_type}</span>) " else ""
    html = """
    <div id='meta-taxon-info'>
      #{yearHtml}
      <p>
        English name: <span id='taxon-common-name' class='common_name'>#{data.common_name}</span>
      </p>
      <p>
        Type: <span id='taxon-type' class="major_type">#{data.major_type}</span>
        #{commonType}
        <core-icon icon='arrow-forward'></core-icon>
        <span id='taxon-subtype' class="major_subtype">#{data.major_subtype}</span>#{minorTypeHtml}
      </p>
      #{deprecatedHtml}
    </div>
    <h3>Taxon Notes</h3>
    <p id='taxon-notes'>#{notes}</p>
    <p class="text-right small text-muted">#{data.taxon_credit}</p>
    """
    $("#modal-taxon-content").html(html)
    ## Bind the dismissive buttons
    # iNaturalist
    $("#modal-inat-linkout")
    .unbind()
    .click ->
      openTab("#{ssar.affiliateQueryUrl.iNaturalist}?q=#{taxon}")
    # CalPhotos
    $("#modal-calphotos-linkout")
    .unbind()
    .click ->
      openTab("#{ssar.affiliateQueryUrl.calPhotos}?rel-taxon=contains&where-taxon=#{taxon}")
    # AmphibiaWeb or Reptile Database
    # See
    # https://github.com/tigerhawkvok/SSAR-species-database/issues/35
    outboundLink = null
    buttonText = null
    if data.linnean_order.toLowerCase() in ["caudata","anura","gymnophiona"]
      # Hey, we can always HOPE to find a North American caecilian ...
      # And, if you're reading this, here's some fun for you:
      # https://www.youtube.com/watch?v=xxsUQtfQ5Ew
      # Anyway, here we want a link to AmphibiaWeb
      buttonText = "AmphibiaWeb"
      outboundLink = "#{ssar.affiliateQueryUrl.amphibiaWeb}?where-genus=#{data.genus}&where-species=#{data.species}"
    else unless isNull(data.linnean_order)
      # It's not an amphibian -- so we want a link to Reptile Database
      buttonText = "Reptile Database"
      outboundLink = "#{ssar.affiliateQueryUrl.reptileDatabase}?genus=#{data.genus}&species=#{data.species}"
    if outboundLink?
      # First, un-hide it in case it was hidden
      $("#modal-alt-linkout")
      .removeClass("hidden")
      .text(buttonText)
      .unbind()
      .click ->
        openTab(outboundLink)
    else
      # Well, wasn't expecting this! But we'll handle it anyway.
      # Hide the link
      $("#modal-alt-linkout")
      .addClass("hidden")
      .unbind()
    formatScientificNames()
    doFontExceptions()
    # Set the heading
    humanTaxon = taxon.charAt(0).toUpperCase()+taxon[1...]
    humanTaxon = humanTaxon.replace(/\+/g," ")
    $("#modal-taxon").attr("heading",humanTaxon)
    # Open it
    taxonArray = taxon.split("+")
    ssar.activeTaxon =
      genus: taxonArray[0]
      species: taxonArray[1]
      subspecies: taxonArray[2]
    if isNull(data.image) then data.image = undefined
    ssar.taxonImage =
      imageUri: data.image
      imageCredit: data.image_credit
      imageLicense: data.image_license
    # Insert the image
    insertModalImage()
    checkTaxonNear taxon, ->
      stopLoad()
      $("#modal-taxon")[0].open()
  .fail (result,status) ->
    stopLoadError()
  false





doFontExceptions = ->
  ###
  # Look for certain keywords to force into capitalized, or force
  # uncapitalized, overriding display CSS rules
  ###
  alwaysLowerCase = [
    "de"
    "and"
    ]

  forceSpecialToLower = (authorityText) ->
    # Returns HTML
    $.each alwaysLowerCase, (i,word) ->
      # Do this to each
      #console.log("Checking #{authorityText} for #{word}")
      search = " #{word} "
      if authorityText?
        authorityText = authorityText.replace(search, " <span class='force-lower'>#{word}</span> ")
    return authorityText

  d$(".authority").each ->
    authorityText = $(this).text()
    unless isNull(authorityText)
      #console.log("Forcing format of #{authorityText}")
      $(this).html(forceSpecialToLower(authorityText))
  false



sortResults = (by_column) ->
  # Somethign clever -- look at each of the by_column points, then
  # throw those into an array and sort those, using their index as a
  # map to data and re-mapping data by those orders. May need to use
  # the index of a duplicated array as the reference - walk through
  # sorted and lookup position in reference, then data[index] = data[ref_pos]
  data = searchParams.result

setHistory = (url = "#",state = null, title = null) ->
  ###
  # Set up the history to provide something linkable
  ###
  history.pushState(state,title,url)
  # Rewrite the query URL
  uri.query = $.url(url).attr("fragment")
  false

clearSearch = (partialReset = false) ->
  ###
  # Clear out the search and reset it to a "fresh" state.
  ###
  $("#result-count").text("")
  calloutHtml = """
  <div class="bs-callout bs-callout-info center-block col-xs-12 col-sm-8 col-md-5">
    Search for a common or scientific name above to begin, eg, "California slender salamander" or "<span class="sciname">Batrachoseps attenuatus</span>"
  </div>
  """
  $("#result_container").html(calloutHtml)
  if partialReset is true then return false
  # Do a history breakpoint
  setHistory()
  # Reset the fields
  $(".cndb-filter").attr("value","")
  $("#collapse-advanced").collapse('hide')
  $("#search").attr("value","")
  $("#linnean-order").polymerSelected("any")
  formatScientificNames()
  false


insertCORSWorkaround = ->
  unless ssar.hasShownWorkaround?
    ssar.hasShownWorkaround = false
  if ssar.hasShownWorkaround
    return false
  try
    browsers = new WhichBrowser()
  catch e
    # Defer it till next time
    return false
  browserExtensionLink = switch browsers.browser.name
    when "Chrome"
      """
      Install the extension "<a class='alert-link' href='https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi?utm_source=chrome-app-launcher-info-dialog'>Allow-Control-Allow-Origin: *</a>", activate it on this domain, and you'll see them in your popups!
      """
    when "Firefox"
      """
      Follow the instructions <a class='alert-link' href='http://www-jo.se/f.pfleger/forcecors-workaround'>for this ForceCORS add-on</a>, or try Chrome for a simpler extension. Once you've done so, you'll see photos in your popups!
      """
    when "Internet Explorer"
      """
      Follow these <a class='alert-link' href='http://stackoverflow.com/a/20947828'>StackOverflow instructions</a> while on this site, and you'll see them in your popups!
      """
    else ""
  html = """
  <div class="alert alert-info alert-dismissible center-block fade in" role="alert">
    <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    <strong>Want CalPhotos images in your species dialogs?</strong> #{browserExtensionLink}
    We're working with CalPhotos to enable this natively, but it's a server change on their side.
  </div>
  """
  $("#result_container").before(html)
  $(".alert").alert()
  ssar.hasShownWorkaround = true
  false


$ ->
  devHello = """
  ****************************************************************************
  Hello developer!
  If you're looking for hints on our API information, this site is open-source
  and released under the GPL. Just click on the GitHub link on the bottom of
  the page, or check out https://github.com/SSARHERPS
  ****************************************************************************
  """
  console.log(devHello)
  # Do bindings
  # console.log("Doing onloads ...")
  animateLoad()
  # Set up popstate
  window.addEventListener "popstate", (e) ->
    uri.query = $.url().attr("fragment")
    try
      loadArgs = Base64.decode(uri.query)
    catch e
      loadArgs = ""
    console.log("Popping state to #{loadArgs}")
    performSearch(loadArgs)
    temp = loadArgs.split("&")[0]
    $("#search").attr("value",temp)
  ## Set events
  $("#do-reset-search").click ->
    clearSearch()
  $("#search_form").submit (e) ->
    e.preventDefault()
    performSearch()
  $("#collapse-advanced").on "shown.bs.collapse", ->
    $("#collapse-icon").attr("icon","unfold-less")
  $("#collapse-advanced").on "hidden.bs.collapse", ->
    $("#collapse-icon").attr("icon","unfold-more")
  # Bind enter keydown
  $("#search_form").keypress (e) ->
    if e.which is 13 then performSearch()
  # Bind clicks
  $("#do-search").click ->
    performSearch()
  $("#do-search-all").click ->
    performSearch(true)
  $("#linnean-order").on "core-select", ->
    # We do want to auto-trigger this when there's a search value,
    # but not when it's empty (even though this is valid)
    if not isNull($("#search").val()) then performSearch()
  # Do a fill of the result container
  if isNull uri.query
    loadArgs = ""
  else
    try
      loadArgs = Base64.decode(uri.query)
      queryUrl = $.url("#{searchParams.apiPath}?q=#{loadArgs}")
      try
        looseState = queryUrl.param("loose").toBool()
      catch e
        looseState = false
      try
        fuzzyState = queryUrl.param("fuzzy").toBool()
      catch e
        fuzzyState = false
      $("#loose").prop("checked",looseState)
      $("#fuzzy").prop("checked",fuzzyState)
      temp = loadArgs.split("&")[0]
      # Remove any plus signs in the query
      temp = temp.replace(/\+/g," ").trim()
      $("#search").attr("value",temp)
      # Filters
      try
        f64 = queryUrl.param("filter")
        filterObj = JSON.parse(Base64.decode(f64))
        openFilters = false
        $.each filterObj, (col,val) ->
          col = col.replace(/_/g,"-")
          selector = "##{col}-filter"
          if col isnt "type"
            $(selector).attr("value",val)
            openFilters = true
          else
            $("#linnean-order").polymerSelected(val)
        if openFilters
          # Open up #collapse-advanced
          $("#collapse-advanced").collapse("show")
      catch e
        # Do nothing
        f64 = false
    catch e
      console.error("Bad argument #{uri.query} => #{loadArgs}, looseState, fuzzyState",looseState,fuzzyState,"#{searchParams.apiPath}?q=#{loadArgs}")
      console.warn(e.message)
      loadArgs = ""
  # Perform the initial search
  if not isNull(loadArgs) and loadArgs isnt "#"
    # console.log("Doing initial search with '#{loadArgs}', hitting","#{searchParams.apiPath}?q=#{loadArgs}")
    $.get(searchParams.targetApi,"q=#{loadArgs}","json")
    .done (result) ->
      # Populate the result container
      if result.status is true and result.count > 0
        # console.log("Got a valid result, formatting #{result.count} results.")
        formatSearchResults(result)
        return false
      if result.count is 0
        result.human_error = "No results for \"#{loadArgs.split("&")[0]}\""
      $("#search-status").attr("text",result.human_error)
      $("#search-status")[0].show()
      console.error(result.error)
      console.warn(result)
      stopLoadError()
    .fail (result,error) ->
      console.error("There was an error loading the generic table")
      console.warn(result,error,result.statusText)
      error = "#{result.status} - #{result.statusText}"
      $("#search-status").attr("text","Couldn't load table - #{error}")
      $("#search-status")[0].show()
      stopLoadError()
    .always ->
      # Anything we always want done
      $("#search").attr("disabled",false)
      false
  else
    stopLoad()
    $("#search").attr("disabled",false)
    $("#loose").prop("checked",true)
