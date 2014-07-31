describe("service.transformer.ApiRequest", function () {
    var transformer, simpleRequest, taggedRequest;

    beforeEach(function () {
        module('twitterapi.transformers');
        inject(function ($injector) {
            transformer = $injector.get('services.transformer.ApiRequest');
        });

        simpleRequest = {
            tweet: "Check out my latest transform request video on egghead.io!",
            commaSeparatedAutoTags: ""
        };
        taggedRequest = {
            tweet: "Angular JS fans, be sure to pick up your tickets for NGCONF!",
            commaSeparatedAutoTags: "Angular, JS, NGCONF"
        }
    });

    it("Should set the status to the tweet provided in the request", function () {
        expect(transformer(simpleRequest)).
            toEqual(JSON.stringify({status: "Check out my latest transform request video on egghead.io!"}));
    });

    it("Should replace the commaSeparatedAutoTags in the tweet with the tag versions", function () {
        expect(transformer(taggedRequest)).
            toEqual(JSON.stringify({status: "#Angular #JS fans, be sure to pick up your tickets for #NGCONF!"}));
    });

    it("Should not require the comma separated auto tags in the request", function () {
        expect(transformer({tweet: "This is my tweet!"})).
            toEqual(JSON.stringify({status: "This is my tweet!"}));
    });
});