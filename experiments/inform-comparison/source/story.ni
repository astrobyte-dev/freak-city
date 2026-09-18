"Counter Test" by "Architecture Evaluation"

Use scoring.

The Test Cafe is a room. "A counter, a clerk and a complaint. The yard is north."
The Yard is north of the Test Cafe. "A quiet yard. The cafe is south."
The counter is a supporter in the Test Cafe. It is fixed in place.

A vessel is a kind of container. A vessel is always open. A vessel is usually not openable. A vessel has a number called portions. The portions of a vessel is usually 3.
The cup is a vessel on the counter. Understand "coffee" as the cup.
The mug is a vessel on the counter. Understand "tea" as the mug. Understand "vessel" as a vessel.
A beverage is a kind of thing. A beverage is usually fixed in place.
The coffee portion is a beverage in the cup. The printed name is "coffee".
The tea portion is a beverage in the mug. The printed name is "tea".
The description of a vessel is "[The item described] contains [portions of the item described] portions. The vessel remains when empty."

Sipping is an action applying to one thing. Understand "sip [something]" or "take another sip of [something]" as sipping.
Check sipping: if the noun is not a vessel, say "That is not a drink vessel." instead; if portions of the noun is 0, say "It is empty." instead.
Carry out sipping:
	decrease portions of the noun by 1;
	if portions of the noun is 0:
		repeat with liquid running through beverages in the noun:
			now liquid is nowhere.
Report sipping: say "You sip from [the noun]; [portions of the noun] portions remain."
Finishing is an action applying to one thing. Understand "finish [something]" as finishing.
Check finishing: if the noun is not a vessel, say "That is not a drink vessel." instead; if portions of the noun is 0, say "It is already empty." instead.
Carry out finishing:
	now portions of the noun is 0;
	repeat with liquid running through beverages in the noun:
		now liquid is nowhere.
Report finishing: say "You finish the drink. [The noun] remains, empty."
Instead of drinking a vessel: try sipping the noun.
Instead of sipping a beverage: try sipping the holder of the noun.
Instead of finishing a beverage: try finishing the holder of the noun.
Instead of drinking a beverage: try sipping the holder of the noun.
Understand "put down [things]" as dropping.

A clerk is a kind of person. A clerk has a number called opinion. A clerk has a number called company-status. A clerk has a truth state called claimed. A clerk has a truth state called inspected. A clerk has a number called due-tick. A clerk has a truth state called completed.
Rowan is a clerk in the Test Cafe.
Kit is a clerk in the Test Cafe.
The interlocutor is a person that varies. The interlocutor is Rowan.
The subject-name is text that varies. The subject-name is "complaint".
The pending-question is text that varies. The pending-question is "complaint".
The clock-tick is a number that varies.
The photograph is on the counter. The description is "A test delivery van beside a sign reading TEST LOT 4. The picture alone does not prove its date."
The player-inspected is a truth state that varies.
After examining the photograph: now player-inspected is true.
Understand "read [something]" as examining.

When play begins: say "Synthetic fixture; no story canon. Rowan asks: Does my supplier complaint sound threatening? Commands include ASK ROWAN ABOUT COMPLAINT, ASK FOR ANOTHER DRINK, SIP CUP, FINISH CUP, ASK ROWAN ABOUT LEDGER, CHECK LEDGER, STATE."

Instead of asking a clerk about something:
	now the interlocutor is the noun;
	if the topic understood matches "complaint":
		now subject-name is "complaint";
		now pending-question is "complaint";
		say "[The noun] asks whether the complaint sounds threatening.";
	otherwise if the topic understood matches "music":
		now subject-name is "music";
		now pending-question is "none";
		say "[The noun] says the playlist consists of one apologetic trumpet.";
	otherwise if the topic understood matches "ledger":
		now subject-name is "ledger";
		now pending-question is "none";
		if completed of the noun is true:
			say "[The noun] reports: I checked the ledger. The entry says TEST LOT 4; that is an attributed ledger observation, not proof of the photo date.";
		otherwise:
			say "[The noun] has not completed a ledger check.";
	otherwise:
		say "Please name complaint, music or ledger. No answer inferred."

Following up is an action applying to nothing. Understand "tell me more" as following up.
Check following up: if the interlocutor is not in the location, say "Name a present person and topic." instead.
Carry out following up:
	if subject-name is "complaint":
		say "The missing lids are the complaint. Your opinion is still yours to give.";
	otherwise if subject-name is "music":
		say "The trumpet player has apologized twice. This is still about music.";
	otherwise:
		say "Ask the clerk about the ledger for its current status."

Requesting refill is an action applying to nothing. Understand "ask for another drink" as requesting refill.
Check requesting refill: if the interlocutor is not in the location, say "No clerk is here to hear you." instead.
Carry out requesting refill: now subject-name is "drink"; now pending-question is "drink"; say "[The interlocutor] offers another coffee in your cup. Yes or no?"

Understand the command "yes" as something new. Understand the command "no" as something new.
Agreeing is an action applying to nothing. Understand "yes" as agreeing.
Disagreeing is an action applying to nothing. Understand "no" as disagreeing.
Threat affirming is an action applying to nothing. Understand "yes very threatening" as threat affirming.
Threat denying is an action applying to nothing. Understand "no it dosen't sound threatening" or "no it doesn't sound threatening" as threat denying.
Check threat affirming: if pending-question is not "complaint", say "Are you talking about the complaint? The current question is unchanged." instead.
Check threat denying: if pending-question is not "complaint", say "Are you talking about the complaint? The current question is unchanged." instead.
Carry out threat affirming: try agreeing.
Carry out threat denying: try disagreeing.
Accepting coffee is an action applying to nothing. Understand "yes ill have another coffee" as accepting coffee.
Check accepting coffee: if pending-question is not "drink", say "Are you requesting coffee? Please ask for another drink. Your complaint answer is unchanged." instead; if the cup is not visible, say "Bring the cup back first; I cannot refill an absent vessel." instead.
Carry out accepting coffee: try agreeing.
Check agreeing: if the interlocutor is not in the location, say "No one here heard an answer." instead.
Check disagreeing: if the interlocutor is not in the location, say "No one here heard an answer." instead.
Carry out agreeing:
	if pending-question is "complaint":
		now opinion of the interlocutor is 1;
		now pending-question is "none";
		say "[The interlocutor] records your opinion: threatening.";
	otherwise if pending-question is "drink":
		now portions of the cup is 3;
		now the coffee portion is in the cup;
		now the cup is on the counter;
		now pending-question is "none";
		say "[The interlocutor] refills the same cup with coffee.";
	otherwise:
		say "Which question are you answering? Nothing agreed."
Carry out disagreeing:
	if pending-question is "complaint":
		now opinion of the interlocutor is -1;
		now pending-question is "none";
		say "[The interlocutor] records your opinion: not threatening.";
	otherwise if pending-question is "drink":
		now pending-question is "none";
		say "The drink is declined.";
	otherwise:
		say "Which question are you answering? Nothing declined."

Offering company is an action applying to nothing. Understand "i could come with you" as offering company.
Declining company is an action applying to nothing. Understand "i can't come with you" as declining company.
Check offering company: if the interlocutor is not in the location, say "No one here heard an offer." instead.
Check declining company: if the interlocutor is not in the location, say "No one here heard a refusal." instead.
Carry out offering company: now company-status of the interlocutor is 1; say "Offer heard. No accompaniment accepted or arranged."
Carry out declining company: now company-status of the interlocutor is -1; say "Refusal heard. I can check the ledger independently."

Instead of telling a clerk about something:
	if the topic understood matches "photograph":
		now claimed of the noun is true;
		say "[The noun] records your spoken claim about the photograph, without verifying it.";
	otherwise:
		say "Please name the claim; nothing recorded."
Instead of showing the photograph to a clerk:
	if the player does not carry the photograph, say "Take the photograph before showing it; another custodian's copy is not yours to show." instead;
	now inspected of the second noun is true;
	say "[The second noun] inspects TEST LOT 4. You retain custody; the date remains unverified."
Instead of giving the photograph to a clerk:
	if the player does not carry the photograph, say "Take the photograph before giving it." instead;
	now the photograph is carried by the second noun;
	say "[The second noun] puts it aside unread. Custody changed; inspection did not."

Clarifying uncertainty is an action out of world applying to nothing. Understand "maybe yes" or "yes but i am not sure" or "i might come with you" as clarifying uncertainty.
Carry out clarifying uncertainty: say "Are you answering the complaint, requesting a drink, or offering company? Please name the intention. No opinion or commitment changed."

Checking ledger is an action applying to nothing. Understand "check ledger" as checking ledger.
Check checking ledger: if the interlocutor is not in the location, say "No clerk here can hear the request." instead; if due-tick of the interlocutor is greater than 0, say "Already scheduled." instead.
Carry out checking ledger: now due-tick of the interlocutor is clock-tick + 4; say "[The interlocutor] will check the ledger after three further timed actions, whether you stay or leave."

Every turn:
	unless the current action is looking or the current action is taking inventory or the current action is examining:
		increment clock-tick;
	repeat with worker running through clerks:
		if due-tick of worker is greater than 0 and clock-tick is at least due-tick of worker and completed of worker is false:
			now completed of worker is true;
			if worker is in the location, say "[The worker] finishes checking the ledger."

Diagnosing is an action out of world applying to nothing. Understand "state" as diagnosing.
Carry out diagnosing:
	say "STATE tick=[clock-tick]; room=[location]; cup-holder=[holder of cup]; portions=[portions of cup]; photo-holder=[holder of photograph]; player-read=[player-inspected]; topic=[subject-name]; pending=[pending-question]; speaker=[interlocutor]. [line break]";
	say "VESSEL mug: holder=[holder of mug]; portions=[portions of mug].[line break]";
	repeat with worker running through clerks:
		say "ACTOR [worker]: opinion=[opinion of worker]; company=[company-status of worker]; claim=[claimed of worker]; inspected=[inspected of worker]; due=[due-tick of worker]; completed=[completed of worker].[line break]"

Release along with an interpreter.

