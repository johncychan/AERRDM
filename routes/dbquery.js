//Dependencies


// Required resources for event type and severity
function RequiredResources(category, severity)
{
	var resources = { police:0, hospital:0, fire:0 }
	//query database based on category and severity and insert into resources
	resources.police = 1;
	resources.hospital = 1;
	resources.hostital = 1;

	return resources;
}

module.exports.RequiredResources = RequiredResources;
