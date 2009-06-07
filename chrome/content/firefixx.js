

var firefixx = function () {
	return {
						
    dragOver : function (aEvent) {
    var dragService = Components.classes["@mozilla.org/widget/dragservice;1"].getService(Components.interfaces.nsIDragService);
    var dragSession = dragService.getCurrentSession();

    var supported = dragSession.isDataFlavorSupported("text/x-moz-url");
    if (!supported)
      supported = dragSession.isDataFlavorSupported("application/x-moz-file");

    if (supported)
	{
      dragSession.canDrop = true;
	  aEvent.stopPropagation();
	}
  },

  dragDrop: function (aEvent) {
    var dragService = Components.classes["@mozilla.org/widget/dragservice;1"].getService(Components.interfaces.nsIDragService);
    var dragSession = dragService.getCurrentSession();
    var _ios = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
    var uris = new Array();
    
	var wrapped = window.content.wrappedJSObject;
	
    // If sourceNode is not null, then the drop was from inside the application
    if (dragSession.sourceNode)
      return;

    // Setup a transfer item to retrieve the file data
    var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
    trans.addDataFlavor("text/x-moz-url");
    trans.addDataFlavor("application/x-moz-file");
    
	if (firefixx.getIssueId() > 0)
	{
		for (var i=0; i<dragSession.numDropItems; i++) {
		  var uri = null;
		  var file = null;

		  dragSession.getData(trans, i);
		  var flavor = {}, data = {}, length = {};
		  trans.getAnyTransferData(flavor, data, length);
		  if (data) {
			try {
			  var str = data.value.QueryInterface(Components.interfaces.nsISupportsString);
			}
			catch(ex) {
			}

			if (str)
			{
			  uri = _ios.newURI(str.data.split("\n")[0], null, null);
			  
				var fileUri = uri.QueryInterface(Components.interfaces.nsIFileURL);
				file = fileUri.file;
				
				
			}
			else {
			  file = data.value.QueryInterface(Components.interfaces.nsIFile);
			  
			}
		  }
          
		  if (file)
		  try
		  {
			firefixx.doUpload(file);
		  }
		  catch (e){}
		}
		content.location.reload();	
		aEvent.preventDefault();
		aEvent.stopPropagation();
	}
    // Use the array of file URIs
  },
encodeUtf8: function(filename)
{	
	
	var storage = Components.classes["@mozilla.org/storagestream;1"]
		.createInstance(Components.interfaces.nsIStorageStream);
	storage.init(4096, filename.length * 3, null);
	var out = storage.getOutputStream(0);

	var binout = Components.classes["@mozilla.org/binaryoutputstream;1"]
		.createInstance(Components.interfaces.nsIBinaryOutputStream);
	binout.setOutputStream(out);
	binout.writeUtf8Z(filename);
	binout.close();
	
	// move past the 32 bit length that writeUtf8Z puts in the front of the stream
	var strStream = storage.newInputStream(4);
	var strBinary = Components.classes["@mozilla.org/binaryinputstream;1"]
		.createInstance(Components.interfaces.nsIBinaryInputStream);
	strBinary.setInputStream (strStream);	
	
	var retval = strBinary.readBytes(strBinary.available());
	
	strBinary.close();	
	
	return retval;
},
getIssueId: function(){
	var location = window.content.location;
	var re = new RegExp(/issues\/(\d+)/);
	var m = re.exec(location);
	return m[1];
}, 
doUpload: function(file)
{
	var filename = firefixx.encodeUtf8(file.leafName);
	var url = window.content.location.protocol + '//' + window.content.location.host;
	var issueId = firefixx.getIssueId();
	url += "/issues/" + issueId + "/addComment";
	try
	{
		var contentType = Components.classes["@mozilla.org/mime;1"]
								  .getService(Components.interfaces.nsIMIMEService)
								  .getTypeFromFile(file);
	}
	catch(e)
	{}
			
	stream = Components.classes["@mozilla.org/network/file-input-stream;1"]
		.createInstance(Components.interfaces.nsIFileInputStream);
	stream.init(file,	0x01, 00004, null);
	
	var binary = Components.classes["@mozilla.org/binaryinputstream;1"]
		.createInstance(Components.interfaces.nsIBinaryInputStream);
	binary.setInputStream (stream);		
	
	var http_request = new XMLHttpRequest();
	
	var boundary = "---------------------------41184676334";
	var requestbody = "--" + boundary + '\r\n';
	
	requestbody = requestbody + 'Content-Disposition: form-data; name=frmFile; filename="' + filename + '"' + '\r\n' 
								+ 'Content-Type: '+ contentType + '\r\n' 
								+ '\r\n'
								+ binary.readBytes(binary.available())
								+ '\r\n'
								+ "--" + boundary + "--\r\n";						
								
									
    http_request.open('POST', url, false);
	http_request.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundary);	
	http_request.setRequestHeader("Content-Length", requestbody.length);
	http_request.sendAsBinary(requestbody);	
	if (http_request.readyState == 4) {
			if (http_request.status == 200) {
				var result = http_request.responseText;						
			} else {
				alert('There was a problem with the request.');
			}
			
		}
    binary.close();
    
    
}

		
	};
}();

window.document.addEventListener("dragover", firefixx.dragOver, true);
// this is the drop event in FF 3.0
window.document.addEventListener("dragdrop", firefixx.dragDrop, true);
// this is the drop event in FF 3.1+
window.document.addEventListener("drop", firefixx.dragDrop, true);
