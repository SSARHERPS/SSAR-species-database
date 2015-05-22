###
# The main coffeescript file for administrative stuff
# Triggered from admin-page.html
###
adminParams = new Object()
adminParams.apiTarget = "admin_api.php"
adminParams.appUrl = "http://ssarherps.org/cndb/"
adminParams.adminPageUrl = "#{adminParams.appUrl}admin-page.html"
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
          <paper-icon-button icon='exit-to-app' class='click' data-url='#{adminParams.appUrl}' id="app-linkout"></paper-icon-button>
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
  newLink = "#{adminParams.appUrl}##{b64s}"
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
      taxonQuery = "#{row.genus}+#{row.species}"
      if not isNull(row.subspecies)
        taxonQuery = "#{taxonQuery}+#{row.subspecies}"
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
    <span class="help-block" id="deprecatedHelp">List names here in the form <span class="code">"Genus species":"Authority: year","Genus species":"Authority: year",...</span></span>
  <paper-input label="Clade" id="edit-major-type" name="edit-major-type" floatingLabel></paper-input>
  <paper-input label="Subtype" id="edit-major-subtype" name="edit-major-subtype" floatingLabel></paper-input>
  <paper-input label="Minor clade / 'Family'" id="edit-minor-type" name="edit-minor-type" floatingLabel></paper-input>
  <paper-input label="Linnean Order" id="edit-linnean-order" name="edit-linnean-order" class="linnean_order" floatingLabel></paper-input>
  <paper-input label="Common Type" id="edit-major-common-type" name="edit-major-common-type" class="major_common_type" floatingLabel></paper-input>
  <paper-input label="Genus authority" id="edit-genus-authority" name="edit-genus-authority" class="genus_authority" floatingLabel></paper-input>
  <paper-input label="Genus authority year" id="edit-gauthyear" name="edit-gauthyear" floatingLabel></paper-input>
  <paper-input label="Species authority" id="edit-species-authority" name="edit-species-authority" class="species_authority" floatingLabel></paper-input>
  <paper-input label="Species authority year" id="edit-sauthyear" name="edit-sauthyear" floatingLabel></paper-input>
  <br/><br/>
  <paper-autogrow-textarea id="edit-notes-autogrow" rows="5">
    <textarea placeholder="Notes" id="edit-notes" name="edit-notes" aria-describedby="notes-help" rows="5"></textarea>
  </paper-autogrow-textarea>
  <span class="help-block" id="notes-help">You can write your notes in Markdown. (<a href="https://daringfireball.net/projects/markdown/syntax" "onclick='window.open(this.href); return false;' onkeypress='window.open(this.href); return false;'">Official Full Syntax Guide</a>)</span>
  <paper-input label="Image" id="edit-image" name="edit-image" floatingLabel aria-describedby="imagehelp"></paper-input>
    <span class="help-block" id="imagehelp">The image path here should be relative to the <span class="code">public_html/cndb/</span> directory.</span>
  <paper-input label="Taxon Credit" id="edit-taxon-credit" name="edit-taxon-credit" floatingLabel aria-describedby="taxon-credit-help"></paper-input>
    <span class="help-block" id="taxon-credit-help">This will be displayed as "Taxon information by [your entry]."</span>
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
  unless $("#modal-taxon-edit").exists()
    $("#search-results").after(html)
  else
    try
      $("html /deep/ #modal-taxon-editor").html(editHtml)
    catch e
      $("html >>> #modal-taxon-editor").html(editHtml)
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
  animateLoad()
  loadModalTaxonEditor("","Create")
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
  #
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
  try
    $("html /deep/ #save-editor")
    .click ->
      saveEditorEntry()
  catch e
    $("html >>> #save-editor")
    .click ->
      saveEditorEntry()
  try
    existensial = $("html /deep/ #last-edited-by").exists()
  catch e
    existensial = $("html >>> #last-edited-by").exists()
  unless existensial
    try
      $("html /deep/ #taxon-credit-help").after(lastEdited)
    catch e
      $("html >>> #taxon-credit-help").after(lastEdited)
  # Look up the taxon, take the first result, and populate
  $.get(searchParams.targetApi,"q=#{taxon}","json")
  .done (result) ->
    try
      data = result.result[0]
      console.log("Populating from",data)
      $.each data, (col,d) ->
        # For each column, replace _ with - and prepend "edit"
        # This should be the selector
        if col is "id"
          $("#taxon-id").attr("value",d)
        if col is "authority_year"
          # Parse it out
          year = parseTaxonYear(d)
          $("#edit-gauthyear").attr("value",year.genus)
          $("#edit-sauthyear").attr("value",year.species)
        else if col is "taxon_author"
          if d is "null" or isNull(d)
            $("#last-edited-by").remove()
            console.warn("Remove edited by! Didn't have an author provided for column '#{col}', giving '#{d}'")
          else
            try
              unless $("html /deep/ #taxon-author-last").exists()
                throw("Bad selector error")
              $("html /deep/ #taxon-author-last").text(d)
            catch e
              try
                unless $("html >>> #taxon-author-last").exists()
                  throw("Bad combinator selector")
                $("html >>> #taxon-author-last").text(d)
              catch e
                $("#taxon-author-last").text(d)
          whoEdited = if isNull($.cookie("ssarherps_fullname")) then $.cookie("ssarherps_user") else $.cookie("ssarherps_fullname")
          try
            $("html /deep/ #edit-taxon-author").attr("value",whoEdited)
          catch e
            $("html >>> #edit-taxon-author").attr("value",whoEdited)
        else
          fieldSelector = "#edit-#{col.replace(/_/g,"-")}"
          if col is "deprecated_scientific"
            d = JSON.stringify(d).slice(1,-1)
          if col isnt "notes"
            try
              unless $("html /deep/ #{fieldSelector}").exists()
                throw("Bad Selector Error")
              $("html /deep/ #{fieldSelector}").attr("value",d)
            catch e
              try
                unless $("html >>> #{fieldSelector}").exists()
                  throw("Bad combinator selector")
                $("html >>> #{fieldSelector}").attr("value",d)
              catch e
                $("#{fieldSelector}").attr("value",d)
          else
            try
              unless $("html /deep/ #{fieldSelector}").exists()
                throw("Bad selector error")
              $("html /deep/ #{fieldSelector}").text(d)
            catch e
              try
                unless $("html >>> #{fieldSelector}").exists()
                  throw("Bad combinator selector")
                $("html >>> #{fieldSelector}").text(d)
              catch e
                $("#{fieldSelector}").text(d)
      # Update the autogrow
      # See https://www.polymer-project.org/0.5/docs/elements/paper-autogrow-textarea.html
      try
        noteArea = $("html /deep/ #edit-notes").get(0)
        $("html /deep/ #edit-notes-autogrow").get(0).update(noteArea)
      catch e
        try
          noteArea = $("html >>> #edit-notes").get(0)
          $("html >>> #edit-notes-autogrow").get(0).update(noteArea)
        catch e
          try
            noteArea = $("#edit-notes").get(0)
            $("#edit-notes-autogrow").get(0).update(noteArea)
          catch e
            # Having an error binding the update
            console.error("Couldn't update autogrow size. Possibly related to","https://github.com/Polymer/paper-input/issues/182")
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
    "taxon-author"
    "taxon-credit"
    ]
  saveObject = new Object()
  ## Manual parses
  try
    # Authority year
    try
      gYear = $("html /deep/ #edit-gauthyear").val()
      sYear = $("html /deep/ #edit-sauthyear").val()
    catch e
      gYear = $("html >>> #edit-gauthyear").val()
      sYear = $("html >>> #edit-sauthyear").val()
    auth = new Object()
    auth[gYear] = sYear
    authYearString = JSON.stringify(auth)
  catch e
    # Didn't work
    console.log("Failed to parase the authority year")
    authYearString = ""
  saveObject["authority_year"] = authYearString
  try
    dep = new Object()
    depS = $("#edit-deprecated-scientific").val()
    depA = depS.split(",")
    $.each depA, (k) ->
      item = k.split(":")
      dep[item[0]] = item[1]
    depString = JSON.stringify(dep)
  catch e
    console.log("Failed to parse the deprecated scientifics")
    depString = ""
  saveObject["deprecated_scientific"] = depString
  # For the rest of the items, iterate over and put on saveObject
  $.each examineIds, (k,id) ->
    console.log(k,id)
    try
      thisSelector = "html /deep/ #edit-#{id}"
      if isNull($(thisSelector)) then throw("Invalid Selector")
    catch e
      thisSelector = "html >>> #edit-#{id}"
    col = id.replace(/-/g,"_")
    val = $(thisSelector).val()
    if col isnt "notes" and col isnt "taxon_credit"
      # We want these to be as literally typed, rather than smart-formatted.
      val = val.toLowerCase()
    saveObject[col] = val
  try
    saveObject["id"] = $("html /deep/ #taxon-id").val()
  catch e
    saveObject["id"] = $("html >>> #taxon-id").val()
  saveString = JSON.stringify(saveObject)
  s64 = Base64.encodeURI(saveString)
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
    return false
  .fail (result,status) ->
    stopLoadError()
    toastStatusMessage("Failed to send the data to the server.")
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
