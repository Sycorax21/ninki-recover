var addr = '';

var addresses = [];
var unspentNodes = [];
var hotprivkeys = {};
var hotpubkeys = {};
var coldprivkeys = {};
var coldpubkeys = {};
var ninkipubkeys = {};
var dustcheck = {};
var transactionhex = '';
var addressesWithUnspent = [];
var unspentOutputs = [];
var outputsToSpend = [];
var publicKeys = [];
var privKeys = [];
var pathsToSpend = [];
const sleep = 5500;

$(document).ready(function () {


    var step = 1;
    $("#step1").show();
    $("#prgsecwiz").width('25%');
    $(".previous").hide();
    $(".next").click(function () {


        if (step == 4) {
            $("#step5").show();
            $("#step4").hide();
            $("#listep4").removeClass("active");
            $("#listep5").addClass("active");
            $("#prgsecwiz").width('100%');
            $(".next").hide();
            $(".previous").show();
            step++;
        }



        if (step == 3) {
            $("#step4").show();
            $("#step3").hide();
            $("#listep3").removeClass("active");
            $("#listep4").addClass("active");
            $("#prgsecwiz").width('80%');
            $(".next").show();
            $(".previous").show();
            step++;
        }

        if (step == 2) {
            $("#step3").show();
            $("#step2").hide();
            $("#listep2").removeClass("active");
            $("#listep3").addClass("active");
            $("#prgsecwiz").width('60%');
            $(".next").show();
            $(".previous").show();
            step++;
        }

        if (step == 1) {
            $("#step2").show();
            $("#step1").hide();
            $("#listep1").removeClass("active");
            $("#listep2").addClass("active");
            $("#prgsecwiz").width('40%');
            $(".previous").show();

            step++;
        }

    });

    $(".previous").click(function () {

        if (step == 2) {
            $("#step1").show();
            $("#step2").hide();
            $("#listep2").removeClass("active");
            $("#listep1").addClass("active");
            $("#prgsecwiz").width('20%');
            $(".previous").hide();
            $(".next").show();
            step--;
        }

        if (step == 3) {
            $("#step2").show();
            $("#step3").hide();
            $("#listep3").removeClass("active");
            $("#listep2").addClass("active");
            $("#prgsecwiz").width('40%');
            $(".previous").show();
            $(".next").show();
            step--;
        }

        if (step == 4) {
            $("#step3").show();
            $("#step4").hide();
            $("#listep4").removeClass("active");
            $("#listep3").addClass("active");
            $("#prgsecwiz").width('60%');
            $(".previous").show();
            $(".next").show();
            step--;
        }

        if (step == 5) {
            $("#step4").show();
            $("#step5").hide();
            $("#listep5").removeClass("active");
            $("#listep4").addClass("active");
            $("#prgsecwiz").width('80%');
            $(".previous").show();
            $(".next").show();
            step--;
        }


    });



    $("#btnSend").click(function () {


        for (var i = 0; i < unspentOutputs.length; i++) {

            var obj = unspentOutputs[i];

            for (var k = 0; k < obj.length; k++) {

                //if (obj[k].value > 0) {
                var h = obj[k].txid;
                var outind = obj[k].output_no;

                var addr = addressesWithUnspent[i]

                var hpriv = hotprivkeys[addr];
                var cpriv = coldprivkeys[addr];

                var hpub = hotpubkeys[addr];
                var cpub = coldpubkeys[addr];
                var npub = ninkipubkeys[addr];

                var pubs = [hpub, cpub, npub];
                publicKeys.push(pubs);

                var privs = [hpriv, cpriv];
                privKeys.push(privs);

                outputsToSpend.push({ transactionId: h, outputIndex: outind });

                pathsToSpend.push(unspentNodes[addr]);
                //}

            }

        }


        var result = "";

        $("#prog").hide();
        $("#progmess").hide();

        var amountsToSend = [];
        balance = balance * 1.0;
        balance = balance - 50000;
        amountsToSend.push(balance);

        var addressToSend = [];
        addressToSend.push($("#txtAddress").val());

        var tx = GetTransactionData(outputsToSpend, pathsToSpend, publicKeys, amountsToSend, addressToSend, privKeys);

		console.log("Sending POST with tx: " + tx);
        var url = 'https://sochain.com/api/v2/send_tx/BTC';
        $.ajax({
            url: url,
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify({
                tx_hex: tx
            }),
            success: function (data) {
                $("#sendresults").html("Transaction Id: " + data.data.txid);
                console.log(data);
            },
            error: function (data) {
                $("#sendresults").html(data.responseJSON.message);
                console.log(data);
            }
        });


    });


    var nodeCounter = 0;
    var knodeCounter = 0;
    var currentNode = '';

    var hotPub = null;
    var coldPub = null;
    var hninki = null;
    var balance = 0;
    var cbalance = 0;
    var addresses = [];

    function scanNode(noderoot, callback) {

        setTimeout(function () {
            var path = noderoot + nodeCounter;

            var address = getAddress(path, hotPub, coldPub, hninki);
            $("#progmess").html("Checking " + address + "...");
            $(".balance").html((balance/ 100000000) + " BTC");

			console.log("querying: https://sochain.com/api/v2/get_address_balance/BTC/" + address);
            jQuery.ajax({
                url: "https://sochain.com/api/v2/get_address_balance/BTC/" + address,
                type: 'GET',
                success: function (data) {

                    console.log(data);


                    if (data.status == 'success') {

                        balance += (data.data.confirmed_balance * 1);
                        cbalance += (data.data.confirmed_balance * 1);
                        addresses.push(address);
                        dustcheck[address] = data.data.confirmed_balance;

                        //nodes.push('m/0/0/');

                    } else {

                        if (knodeCounter > 50 && cbalance == 0) {

                            nodeCounter = 50001;

                        }

                        cbalance = 0;
                        knodeCounter++;
                    }


                },
                async: false
            });

            nodeCounter++;

            if (nodeCounter <= 20) {
                scanNode(noderoot, callback);
            } else {
                nodeCounter = 0;
                knodeCounter = 0;
                callback();
            }
        }, sleep);
    }


    var friendNodeCounter = 0;

    function scanFriendNodes(callback) {

        if (activeFriendNodes.length == 0) {
            callback();
        }
        scanNode(activeFriendNodes[friendNodeCounter], function () {

            friendNodeCounter++;

            if (friendNodeCounter < (activeFriendNodes.length)) {
                scanFriendNodes(callback);
            } else {
                callback();
            }

        });
    }


    var activeFriendNodes = [];
    var estNumberOfFriends = 1;
    var activeFriendCounter = 1000;
    function scanForActiveFriendNodes(callback) {

        setTimeout(function () {

            var path = 'm/0/' + activeFriendCounter + '/0';

            var address = getAddress(path, hotPub, coldPub, hninki);

            $("#progmess").html("Checking node " + path);
			
			console.log("querying: https://sochain.com/api/v2/get_address_balance/BTC/" + address);
            jQuery.ajax({
                url: "https://sochain.com/api/v2/get_address_balance/BTC/" + address,
                type: 'GET',
                success: function (data) {

                    console.log(data);

                    if (data.status == 'success') {

                        activeFriendNodes.push(path);
                    }
                },
                async: false
            });

            activeFriendCounter++;

            if (activeFriendCounter < (1000 + estNumberOfFriends)) {
                scanForActiveFriendNodes(callback);
            } else {
                callback();
            }
        }, sleep);
    }



    $("#btnSweep").click(function () {
        //var canv = $('#qrc canvas')[0];
        //var url = canv.canvas.toDataURL('image/png');

        //                canv.toBlob(function (blob) {
        //                    saveAs(blob, "pretty image.png");
        //                });

        //return;

        var test = '';

        balance = 0;
        cbalance = 0;

        var hot = $("#txtHot").val();
        var cold = $("#txtCold").val();
        var ninki = $("#txtNinki").val();

        $("#progstatus").width('20%');
        $("#progmess").html("Deriving wallet from seeds...");


        var mhot = mnemonicToHex(hot);
        var mcold = mnemonicToHex(cold);

        hotPub = Bitcoin2.HDWallet.fromSeedHex(mhot);
        coldPub = Bitcoin2.HDWallet.fromSeedHex(mcold);
        hninki = Bitcoin2.HDWallet.fromBase58(ninki);

        var nodes = [];


        var publicKeyLookup = {};

        $("#progstatus").width('40%');
        $("#progmess").html("Sweeping friend nodes...");

        var k = 0;
        var i = 0;

        //scan friend nodes

        scanForActiveFriendNodes(function () {

            //sweep external addresses


            scanFriendNodes(function () {

                $("#progstatus").width('60%');
                $("#progmess").html("checking receive external addresses...");

                scanNode('m/0/0/', function () {

                    $("#progmess").html("Finished sweeping external address node m/0/0/");
                    $("#progstatus").width('80%');

                    scanNode('m/0/1/', function () {

                        $("#progmess").html("Finished sweeping change address node m/0/1/");
                        $("#progstatus").width('90%');



                        var sadd = "";
                        for (var i = 0; i < addresses.length; i++) {
							
                            jQuery.ajax({
                                url: "https://sochain.com/api/v2/get_tx_unspent/BTC/" + addresses[i] + "/unspents",
                                type: 'GET',
                                success: function (data) {
                                    if (data.length > 0) {
                                        console.log(data);
                                        $("#progmess").html("Checking " + addresses[i] + "...");
                                        unspentOutputs.push(data);
                                        addressesWithUnspent.push(addresses[i]);
                                    }
                                },
                                async: false
                            });

                        }


                        $("#progstatus").width('100%');
                        $("#progmess").html("Address sweep is complete. Click next to send the funds to your address.");

                    });


                });

            });

        });

    });


});


//function aMultiSigHashForSigning
//TODO: rename
function MultiSigHashForSigning(publickey1, publickey2, publickey3, index, outputsToSpend, outputsToSend, addressToSend) {


    //this function will create the temporary transaction
    //with a single input used to generate the signature
    //for the single input

    //instantiate a new transaction
    var tx = new Bitcoin2.Transaction();

    var ins = [];
    var outs = [];

    //generate the script to sign off on
    //using the users hotkey,coldkey and the ninki public key
    //2 of...
    var script = [0x52];
    //hotkey
    script.push(33);
    script = script.concat(publickey1);
    //cold key
    script.push(33);
    script = script.concat(publickey2);
    //ninki key
    script.push(33);
    script = script.concat(publickey3);
    //..3
    script.push(0x53);
    //..multisig

    script.push(0xae);

    //generate the same number of inputs as on the transaction to broadcast
    //but replace the other inputs with a zero byte! (thanks satoshi-san)
    for (var i = 0; i < outputsToSpend.length; i++) {
        var p = outputsToSpend[i].transactionId + ':' + outputsToSpend[i].outputIndex.toString();
        tx.addInput(p);
        if (i == index) {
            tx.ins[i].script = new Bitcoin2.Script(script);
        } else {
            tx.ins[i].script = new Bitcoin2.Script([0]);
        }
    }

    //mirror the outpurs in the transaction to broadcast
    var test = '';
    for (var i = 0; i < outputsToSend.length; i++) {
        var addr = new Bitcoin2.Address(addressToSend[i]);
        tx.addOutput(addressToSend[i], outputsToSend[i]);
    }

    //hash the transaction-- this has will be used as an input to the signature function
    var txHash = tx.hashTransactionForSignature(tx.ins[index].script, index, 1);

    return txHash;

}

//function aGetTransaction
//TODO: rename
//generateas a transaction from a set of keys, outputs, signatures and addresses to send to
function GetTransaction(publickeys, outputsToSpend, outputsToSend, addressToSend, sigs) {


    //create a new transaction
    var tx = new Bitcoin2.Transaction();

    var ins = [];
    var outs = [];

    //generate the scripts to spend the outputs
    for (var i = 0; i < outputsToSpend.length; i++) {

        var len1 = sigs[i][0].length;
        var len2 = sigs[i][1].length;
        var script = [];

        //append the signature
        var script1 = [];
        script1 = script1.concat(sigs[i][0]);
        //prepend the length of the signature
        script1.unshift(len1);
        script1.unshift(0x00);

        var script2 = [];
        script2 = script2.concat(sigs[i][1]);
        //prepend the length of the signature
        script2.unshift(len2);

        script = script.concat(script1);
        script = script.concat(script2);

        //push the script used to validate the spend
        script.push(0x4c);
        script.push(105);
        script.push(0x52);
        script.push(33);
        script = script.concat(publickeys[i][0]);
        script.push(33);
        script = script.concat(publickeys[i][1]);
        script.push(33);
        script = script.concat(publickeys[i][2]);
        script.push(0x53);
        script.push(0xae);

        //add the input to the transaction referencing the output to spend
        var p = outputsToSpend[i].transactionId + ':' + outputsToSpend[i].outputIndex.toString();
        tx.addInput(p);

        //set the script on the input
        tx.ins[i].script = new Bitcoin2.Script(script);

    }

    //add the outputs to the transaction
    for (var i = 0; i < outputsToSend.length; i++) {
        tx.addOutput(addressToSend[i], outputsToSend[i]);
    }

    var txHash = Array.apply([], tx.serialize());

    return txHash;
}


function GetTransactionData(outputsToSpend, paths, publicKeys, amountsToSend, addressToSend, privKeys) {

    var derivedPublicKeys = [];
    var derivedPrivateKeys = [];

    var signatures = [];
    var hashesForSigning = [];
    for (var i = 0; i < outputsToSpend.length; i++) {
        var path = paths[i];

        //derive the hashes for signing off on each input
        var hashForSigning = MultiSigHashForSigning(publicKeys[i][0], publicKeys[i][1], publicKeys[i][2], i, outputsToSpend, amountsToSend, addressToSend);
        //add to collection so they can be provided to the server later
        //this saves the same process having to be done on the server side
        hashesForSigning.push(Bitcoin2.convert.bytesToHex(hashForSigning));

        //get the user's hot private key
        var hkey = privKeys[i][0];

        //sign the input
        var sig = hkey.sign(hashForSigning).concat([1]);

        var hkey2 = privKeys[i][1];

        //sign the input
        var sig2 = hkey2.sign(hashForSigning).concat([1]);

        var hcsigs = [sig, sig2];
        //add the signature
        signatures.push(hcsigs);
    }

    //get the transaction and return along with the hashes used to sign
    var txn = GetTransaction(publicKeys, outputsToSpend, amountsToSend, addressToSend, signatures);
	
    //generate the signatures
    //TO DO: check call back?
    return Bitcoin2.convert.bytesToHex(txn);
}


function getAddress(path, hotPub, coldPub, hninki) {

    var hotKey = deriveChild(path, hotPub);
    var coldKey = deriveChild(path, coldPub);
    var ninkiKey = deriveChild(path, hninki);

    //now create the multisig address
    var script = [0x52];
    script.push(33);
    script = script.concat(hotKey.pub.toBytes());
    script.push(33);
    script = script.concat(coldKey.pub.toBytes());
    script.push(33);
    script = script.concat(ninkiKey.pub.toBytes());
    script.push(0x53);
    script.push(0xae);
    var address = multiSig(script);

    unspentNodes[address] = path;
    hotprivkeys[address] = hotKey.priv;
    hotpubkeys[address] = hotKey.pub.toBytes();
    coldprivkeys[address] = coldKey.priv;
    coldpubkeys[address] = coldKey.pub.toBytes();
    ninkipubkeys[address] = ninkiKey.pub.toBytes();
    return address;

}


function deriveChild(path, hdwallet) {

    var e = path.split('/');
    var ret = hdwallet;
    // Special cases:
    if (path == 'm' || path == 'M' || path == 'm\'' || path == 'M\'') return this;

    for (var i in e) {
        var c = e[i];

        if (i == 0) {
            if (c != 'm') throw new Error("invalid path");
            continue;
        }

        var use_private = (c.length > 1) && (c[c.length - 1] == '\'');
        var child_index = parseInt(use_private ? c.slice(0, c.length - 1) : c) & 0x7fffffff;

        if (use_private)
            child_index += 0x80000000;

        ret = ret.derive(child_index);
    }

    return ret;
}

//multi sig address hash
function multiSig(rs) {
    var x = Bitcoin2.Crypto.RIPEMD160(Bitcoin2.Crypto.SHA256(Bitcoin2.convert.bytesToWordArray(rs)));
    x = Bitcoin2.convert.wordArrayToBytes(x);
    x.unshift(0x5);
    var r = x;
    r = Bitcoin2.Crypto.SHA256(Bitcoin2.Crypto.SHA256(Bitcoin2.convert.bytesToWordArray(r)));
    var checksum = Bitcoin2.convert.wordArrayToBytes(r).slice(0, 4);
    var address = Bitcoin2.base58.encode(x.concat(checksum));
    return address;
}



this.wordlist = [
  "abandon",
  "ability",
  "able",
  "about",
  "above",
  "absent",
  "absorb",
  "abstract",
  "absurd",
  "abuse",
  "access",
  "accident",
  "account",
  "accuse",
  "achieve",
  "acid",
  "acoustic",
  "acquire",
  "across",
  "act",
  "action",
  "actor",
  "actress",
  "actual",
  "adapt",
  "add",
  "addict",
  "address",
  "adjust",
  "admit",
  "adult",
  "advance",
  "advice",
  "aerobic",
  "affair",
  "afford",
  "afraid",
  "again",
  "age",
  "agent",
  "agree",
  "ahead",
  "aim",
  "air",
  "airport",
  "aisle",
  "alarm",
  "album",
  "alcohol",
  "alert",
  "alien",
  "all",
  "alley",
  "allow",
  "almost",
  "alone",
  "alpha",
  "already",
  "also",
  "alter",
  "always",
  "amateur",
  "amazing",
  "among",
  "amount",
  "amused",
  "analyst",
  "anchor",
  "ancient",
  "anger",
  "angle",
  "angry",
  "animal",
  "ankle",
  "announce",
  "annual",
  "another",
  "answer",
  "antenna",
  "antique",
  "anxiety",
  "any",
  "apart",
  "apology",
  "appear",
  "apple",
  "approve",
  "april",
  "arch",
  "arctic",
  "area",
  "arena",
  "argue",
  "arm",
  "armed",
  "armor",
  "army",
  "around",
  "arrange",
  "arrest",
  "arrive",
  "arrow",
  "art",
  "artefact",
  "artist",
  "artwork",
  "ask",
  "aspect",
  "assault",
  "asset",
  "assist",
  "assume",
  "asthma",
  "athlete",
  "atom",
  "attack",
  "attend",
  "attitude",
  "attract",
  "auction",
  "audit",
  "august",
  "aunt",
  "author",
  "auto",
  "autumn",
  "average",
  "avocado",
  "avoid",
  "awake",
  "aware",
  "away",
  "awesome",
  "awful",
  "awkward",
  "axis",
  "baby",
  "bachelor",
  "bacon",
  "badge",
  "bag",
  "balance",
  "balcony",
  "ball",
  "bamboo",
  "banana",
  "banner",
  "bar",
  "barely",
  "bargain",
  "barrel",
  "base",
  "basic",
  "basket",
  "battle",
  "beach",
  "bean",
  "beauty",
  "because",
  "become",
  "beef",
  "before",
  "begin",
  "behave",
  "behind",
  "believe",
  "below",
  "belt",
  "bench",
  "benefit",
  "best",
  "betray",
  "better",
  "between",
  "beyond",
  "bicycle",
  "bid",
  "bike",
  "bind",
  "biology",
  "bird",
  "birth",
  "bitter",
  "black",
  "blade",
  "blame",
  "blanket",
  "blast",
  "bleak",
  "bless",
  "blind",
  "blood",
  "blossom",
  "blouse",
  "blue",
  "blur",
  "blush",
  "board",
  "boat",
  "body",
  "boil",
  "bomb",
  "bone",
  "bonus",
  "book",
  "boost",
  "border",
  "boring",
  "borrow",
  "boss",
  "bottom",
  "bounce",
  "box",
  "boy",
  "bracket",
  "brain",
  "brand",
  "brass",
  "brave",
  "bread",
  "breeze",
  "brick",
  "bridge",
  "brief",
  "bright",
  "bring",
  "brisk",
  "broccoli",
  "broken",
  "bronze",
  "broom",
  "brother",
  "brown",
  "brush",
  "bubble",
  "buddy",
  "budget",
  "buffalo",
  "build",
  "bulb",
  "bulk",
  "bullet",
  "bundle",
  "bunker",
  "burden",
  "burger",
  "burst",
  "bus",
  "business",
  "busy",
  "butter",
  "buyer",
  "buzz",
  "cabbage",
  "cabin",
  "cable",
  "cactus",
  "cage",
  "cake",
  "call",
  "calm",
  "camera",
  "camp",
  "can",
  "canal",
  "cancel",
  "candy",
  "cannon",
  "canoe",
  "canvas",
  "canyon",
  "capable",
  "capital",
  "captain",
  "car",
  "carbon",
  "card",
  "cargo",
  "carpet",
  "carry",
  "cart",
  "case",
  "cash",
  "casino",
  "castle",
  "casual",
  "cat",
  "catalog",
  "catch",
  "category",
  "cattle",
  "caught",
  "cause",
  "caution",
  "cave",
  "ceiling",
  "celery",
  "cement",
  "census",
  "century",
  "cereal",
  "certain",
  "chair",
  "chalk",
  "champion",
  "change",
  "chaos",
  "chapter",
  "charge",
  "chase",
  "chat",
  "cheap",
  "check",
  "cheese",
  "chef",
  "cherry",
  "chest",
  "chicken",
  "chief",
  "child",
  "chimney",
  "choice",
  "choose",
  "chronic",
  "chuckle",
  "chunk",
  "churn",
  "cigar",
  "cinnamon",
  "circle",
  "citizen",
  "city",
  "civil",
  "claim",
  "clap",
  "clarify",
  "claw",
  "clay",
  "clean",
  "clerk",
  "clever",
  "click",
  "client",
  "cliff",
  "climb",
  "clinic",
  "clip",
  "clock",
  "clog",
  "close",
  "cloth",
  "cloud",
  "clown",
  "club",
  "clump",
  "cluster",
  "clutch",
  "coach",
  "coast",
  "coconut",
  "code",
  "coffee",
  "coil",
  "coin",
  "collect",
  "color",
  "column",
  "combine",
  "come",
  "comfort",
  "comic",
  "common",
  "company",
  "concert",
  "conduct",
  "confirm",
  "congress",
  "connect",
  "consider",
  "control",
  "convince",
  "cook",
  "cool",
  "copper",
  "copy",
  "coral",
  "core",
  "corn",
  "correct",
  "cost",
  "cotton",
  "couch",
  "country",
  "couple",
  "course",
  "cousin",
  "cover",
  "coyote",
  "crack",
  "cradle",
  "craft",
  "cram",
  "crane",
  "crash",
  "crater",
  "crawl",
  "crazy",
  "cream",
  "credit",
  "creek",
  "crew",
  "cricket",
  "crime",
  "crisp",
  "critic",
  "crop",
  "cross",
  "crouch",
  "crowd",
  "crucial",
  "cruel",
  "cruise",
  "crumble",
  "crunch",
  "crush",
  "cry",
  "crystal",
  "cube",
  "culture",
  "cup",
  "cupboard",
  "curious",
  "current",
  "curtain",
  "curve",
  "cushion",
  "custom",
  "cute",
  "cycle",
  "dad",
  "damage",
  "damp",
  "dance",
  "danger",
  "daring",
  "dash",
  "daughter",
  "dawn",
  "day",
  "deal",
  "debate",
  "debris",
  "decade",
  "december",
  "decide",
  "decline",
  "decorate",
  "decrease",
  "deer",
  "defense",
  "define",
  "defy",
  "degree",
  "delay",
  "deliver",
  "demand",
  "demise",
  "denial",
  "dentist",
  "deny",
  "depart",
  "depend",
  "deposit",
  "depth",
  "deputy",
  "derive",
  "describe",
  "desert",
  "design",
  "desk",
  "despair",
  "destroy",
  "detail",
  "detect",
  "develop",
  "device",
  "devote",
  "diagram",
  "dial",
  "diamond",
  "diary",
  "dice",
  "diesel",
  "diet",
  "differ",
  "digital",
  "dignity",
  "dilemma",
  "dinner",
  "dinosaur",
  "direct",
  "dirt",
  "disagree",
  "discover",
  "disease",
  "dish",
  "dismiss",
  "disorder",
  "display",
  "distance",
  "divert",
  "divide",
  "divorce",
  "dizzy",
  "doctor",
  "document",
  "dog",
  "doll",
  "dolphin",
  "domain",
  "donate",
  "donkey",
  "donor",
  "door",
  "dose",
  "double",
  "dove",
  "draft",
  "dragon",
  "drama",
  "drastic",
  "draw",
  "dream",
  "dress",
  "drift",
  "drill",
  "drink",
  "drip",
  "drive",
  "drop",
  "drum",
  "dry",
  "duck",
  "dumb",
  "dune",
  "during",
  "dust",
  "dutch",
  "duty",
  "dwarf",
  "dynamic",
  "eager",
  "eagle",
  "early",
  "earn",
  "earth",
  "easily",
  "east",
  "easy",
  "echo",
  "ecology",
  "economy",
  "edge",
  "edit",
  "educate",
  "effort",
  "egg",
  "eight",
  "either",
  "elbow",
  "elder",
  "electric",
  "elegant",
  "element",
  "elephant",
  "elevator",
  "elite",
  "else",
  "embark",
  "embody",
  "embrace",
  "emerge",
  "emotion",
  "employ",
  "empower",
  "empty",
  "enable",
  "enact",
  "end",
  "endless",
  "endorse",
  "enemy",
  "energy",
  "enforce",
  "engage",
  "engine",
  "enhance",
  "enjoy",
  "enlist",
  "enough",
  "enrich",
  "enroll",
  "ensure",
  "enter",
  "entire",
  "entry",
  "envelope",
  "episode",
  "equal",
  "equip",
  "era",
  "erase",
  "erode",
  "erosion",
  "error",
  "erupt",
  "escape",
  "essay",
  "essence",
  "estate",
  "eternal",
  "ethics",
  "evidence",
  "evil",
  "evoke",
  "evolve",
  "exact",
  "example",
  "excess",
  "exchange",
  "excite",
  "exclude",
  "excuse",
  "execute",
  "exercise",
  "exhaust",
  "exhibit",
  "exile",
  "exist",
  "exit",
  "exotic",
  "expand",
  "expect",
  "expire",
  "explain",
  "expose",
  "express",
  "extend",
  "extra",
  "eye",
  "eyebrow",
  "fabric",
  "face",
  "faculty",
  "fade",
  "faint",
  "faith",
  "fall",
  "false",
  "fame",
  "family",
  "famous",
  "fan",
  "fancy",
  "fantasy",
  "farm",
  "fashion",
  "fat",
  "fatal",
  "father",
  "fatigue",
  "fault",
  "favorite",
  "feature",
  "february",
  "federal",
  "fee",
  "feed",
  "feel",
  "female",
  "fence",
  "festival",
  "fetch",
  "fever",
  "few",
  "fiber",
  "fiction",
  "field",
  "figure",
  "file",
  "film",
  "filter",
  "final",
  "find",
  "fine",
  "finger",
  "finish",
  "fire",
  "firm",
  "first",
  "fiscal",
  "fish",
  "fit",
  "fitness",
  "fix",
  "flag",
  "flame",
  "flash",
  "flat",
  "flavor",
  "flee",
  "flight",
  "flip",
  "float",
  "flock",
  "floor",
  "flower",
  "fluid",
  "flush",
  "fly",
  "foam",
  "focus",
  "fog",
  "foil",
  "fold",
  "follow",
  "food",
  "foot",
  "force",
  "forest",
  "forget",
  "fork",
  "fortune",
  "forum",
  "forward",
  "fossil",
  "foster",
  "found",
  "fox",
  "fragile",
  "frame",
  "frequent",
  "fresh",
  "friend",
  "fringe",
  "frog",
  "front",
  "frost",
  "frown",
  "frozen",
  "fruit",
  "fuel",
  "fun",
  "funny",
  "furnace",
  "fury",
  "future",
  "gadget",
  "gain",
  "galaxy",
  "gallery",
  "game",
  "gap",
  "garage",
  "garbage",
  "garden",
  "garlic",
  "garment",
  "gas",
  "gasp",
  "gate",
  "gather",
  "gauge",
  "gaze",
  "general",
  "genius",
  "genre",
  "gentle",
  "genuine",
  "gesture",
  "ghost",
  "giant",
  "gift",
  "giggle",
  "ginger",
  "giraffe",
  "girl",
  "give",
  "glad",
  "glance",
  "glare",
  "glass",
  "glide",
  "glimpse",
  "globe",
  "gloom",
  "glory",
  "glove",
  "glow",
  "glue",
  "goat",
  "goddess",
  "gold",
  "good",
  "goose",
  "gorilla",
  "gospel",
  "gossip",
  "govern",
  "gown",
  "grab",
  "grace",
  "grain",
  "grant",
  "grape",
  "grass",
  "gravity",
  "great",
  "green",
  "grid",
  "grief",
  "grit",
  "grocery",
  "group",
  "grow",
  "grunt",
  "guard",
  "guess",
  "guide",
  "guilt",
  "guitar",
  "gun",
  "gym",
  "habit",
  "hair",
  "half",
  "hammer",
  "hamster",
  "hand",
  "happy",
  "harbor",
  "hard",
  "harsh",
  "harvest",
  "hat",
  "have",
  "hawk",
  "hazard",
  "head",
  "health",
  "heart",
  "heavy",
  "hedgehog",
  "height",
  "hello",
  "helmet",
  "help",
  "hen",
  "hero",
  "hidden",
  "high",
  "hill",
  "hint",
  "hip",
  "hire",
  "history",
  "hobby",
  "hockey",
  "hold",
  "hole",
  "holiday",
  "hollow",
  "home",
  "honey",
  "hood",
  "hope",
  "horn",
  "horror",
  "horse",
  "hospital",
  "host",
  "hotel",
  "hour",
  "hover",
  "hub",
  "huge",
  "human",
  "humble",
  "humor",
  "hundred",
  "hungry",
  "hunt",
  "hurdle",
  "hurry",
  "hurt",
  "husband",
  "hybrid",
  "ice",
  "icon",
  "idea",
  "identify",
  "idle",
  "ignore",
  "ill",
  "illegal",
  "illness",
  "image",
  "imitate",
  "immense",
  "immune",
  "impact",
  "impose",
  "improve",
  "impulse",
  "inch",
  "include",
  "income",
  "increase",
  "index",
  "indicate",
  "indoor",
  "industry",
  "infant",
  "inflict",
  "inform",
  "inhale",
  "inherit",
  "initial",
  "inject",
  "injury",
  "inmate",
  "inner",
  "innocent",
  "input",
  "inquiry",
  "insane",
  "insect",
  "inside",
  "inspire",
  "install",
  "intact",
  "interest",
  "into",
  "invest",
  "invite",
  "involve",
  "iron",
  "island",
  "isolate",
  "issue",
  "item",
  "ivory",
  "jacket",
  "jaguar",
  "jar",
  "jazz",
  "jealous",
  "jeans",
  "jelly",
  "jewel",
  "job",
  "join",
  "joke",
  "journey",
  "joy",
  "judge",
  "juice",
  "jump",
  "jungle",
  "junior",
  "junk",
  "just",
  "kangaroo",
  "keen",
  "keep",
  "ketchup",
  "key",
  "kick",
  "kid",
  "kidney",
  "kind",
  "kingdom",
  "kiss",
  "kit",
  "kitchen",
  "kite",
  "kitten",
  "kiwi",
  "knee",
  "knife",
  "knock",
  "know",
  "lab",
  "label",
  "labor",
  "ladder",
  "lady",
  "lake",
  "lamp",
  "language",
  "laptop",
  "large",
  "later",
  "latin",
  "laugh",
  "laundry",
  "lava",
  "law",
  "lawn",
  "lawsuit",
  "layer",
  "lazy",
  "leader",
  "leaf",
  "learn",
  "leave",
  "lecture",
  "left",
  "leg",
  "legal",
  "legend",
  "leisure",
  "lemon",
  "lend",
  "length",
  "lens",
  "leopard",
  "lesson",
  "letter",
  "level",
  "liar",
  "liberty",
  "library",
  "license",
  "life",
  "lift",
  "light",
  "like",
  "limb",
  "limit",
  "link",
  "lion",
  "liquid",
  "list",
  "little",
  "live",
  "lizard",
  "load",
  "loan",
  "lobster",
  "local",
  "lock",
  "logic",
  "lonely",
  "long",
  "loop",
  "lottery",
  "loud",
  "lounge",
  "love",
  "loyal",
  "lucky",
  "luggage",
  "lumber",
  "lunar",
  "lunch",
  "luxury",
  "lyrics",
  "machine",
  "mad",
  "magic",
  "magnet",
  "maid",
  "mail",
  "main",
  "major",
  "make",
  "mammal",
  "man",
  "manage",
  "mandate",
  "mango",
  "mansion",
  "manual",
  "maple",
  "marble",
  "march",
  "margin",
  "marine",
  "market",
  "marriage",
  "mask",
  "mass",
  "master",
  "match",
  "material",
  "math",
  "matrix",
  "matter",
  "maximum",
  "maze",
  "meadow",
  "mean",
  "measure",
  "meat",
  "mechanic",
  "medal",
  "media",
  "melody",
  "melt",
  "member",
  "memory",
  "mention",
  "menu",
  "mercy",
  "merge",
  "merit",
  "merry",
  "mesh",
  "message",
  "metal",
  "method",
  "middle",
  "midnight",
  "milk",
  "million",
  "mimic",
  "mind",
  "minimum",
  "minor",
  "minute",
  "miracle",
  "mirror",
  "misery",
  "miss",
  "mistake",
  "mix",
  "mixed",
  "mixture",
  "mobile",
  "model",
  "modify",
  "mom",
  "moment",
  "monitor",
  "monkey",
  "monster",
  "month",
  "moon",
  "moral",
  "more",
  "morning",
  "mosquito",
  "mother",
  "motion",
  "motor",
  "mountain",
  "mouse",
  "move",
  "movie",
  "much",
  "muffin",
  "mule",
  "multiply",
  "muscle",
  "museum",
  "mushroom",
  "music",
  "must",
  "mutual",
  "myself",
  "mystery",
  "myth",
  "naive",
  "name",
  "napkin",
  "narrow",
  "nasty",
  "nation",
  "nature",
  "near",
  "neck",
  "need",
  "negative",
  "neglect",
  "neither",
  "nephew",
  "nerve",
  "nest",
  "net",
  "network",
  "neutral",
  "never",
  "news",
  "next",
  "nice",
  "night",
  "noble",
  "noise",
  "nominee",
  "noodle",
  "normal",
  "north",
  "nose",
  "notable",
  "note",
  "nothing",
  "notice",
  "novel",
  "now",
  "nuclear",
  "number",
  "nurse",
  "nut",
  "oak",
  "obey",
  "object",
  "oblige",
  "obscure",
  "observe",
  "obtain",
  "obvious",
  "occur",
  "ocean",
  "october",
  "odor",
  "off",
  "offer",
  "office",
  "often",
  "oil",
  "okay",
  "old",
  "olive",
  "olympic",
  "omit",
  "once",
  "one",
  "onion",
  "online",
  "only",
  "open",
  "opera",
  "opinion",
  "oppose",
  "option",
  "orange",
  "orbit",
  "orchard",
  "order",
  "ordinary",
  "organ",
  "orient",
  "original",
  "orphan",
  "ostrich",
  "other",
  "outdoor",
  "outer",
  "output",
  "outside",
  "oval",
  "oven",
  "over",
  "own",
  "owner",
  "oxygen",
  "oyster",
  "ozone",
  "pact",
  "paddle",
  "page",
  "pair",
  "palace",
  "palm",
  "panda",
  "panel",
  "panic",
  "panther",
  "paper",
  "parade",
  "parent",
  "park",
  "parrot",
  "party",
  "pass",
  "patch",
  "path",
  "patient",
  "patrol",
  "pattern",
  "pause",
  "pave",
  "payment",
  "peace",
  "peanut",
  "pear",
  "peasant",
  "pelican",
  "pen",
  "penalty",
  "pencil",
  "people",
  "pepper",
  "perfect",
  "permit",
  "person",
  "pet",
  "phone",
  "photo",
  "phrase",
  "physical",
  "piano",
  "picnic",
  "picture",
  "piece",
  "pig",
  "pigeon",
  "pill",
  "pilot",
  "pink",
  "pioneer",
  "pipe",
  "pistol",
  "pitch",
  "pizza",
  "place",
  "planet",
  "plastic",
  "plate",
  "play",
  "please",
  "pledge",
  "pluck",
  "plug",
  "plunge",
  "poem",
  "poet",
  "point",
  "polar",
  "pole",
  "police",
  "pond",
  "pony",
  "pool",
  "popular",
  "portion",
  "position",
  "possible",
  "post",
  "potato",
  "pottery",
  "poverty",
  "powder",
  "power",
  "practice",
  "praise",
  "predict",
  "prefer",
  "prepare",
  "present",
  "pretty",
  "prevent",
  "price",
  "pride",
  "primary",
  "print",
  "priority",
  "prison",
  "private",
  "prize",
  "problem",
  "process",
  "produce",
  "profit",
  "program",
  "project",
  "promote",
  "proof",
  "property",
  "prosper",
  "protect",
  "proud",
  "provide",
  "public",
  "pudding",
  "pull",
  "pulp",
  "pulse",
  "pumpkin",
  "punch",
  "pupil",
  "puppy",
  "purchase",
  "purity",
  "purpose",
  "purse",
  "push",
  "put",
  "puzzle",
  "pyramid",
  "quality",
  "quantum",
  "quarter",
  "question",
  "quick",
  "quit",
  "quiz",
  "quote",
  "rabbit",
  "raccoon",
  "race",
  "rack",
  "radar",
  "radio",
  "rail",
  "rain",
  "raise",
  "rally",
  "ramp",
  "ranch",
  "random",
  "range",
  "rapid",
  "rare",
  "rate",
  "rather",
  "raven",
  "raw",
  "razor",
  "ready",
  "real",
  "reason",
  "rebel",
  "rebuild",
  "recall",
  "receive",
  "recipe",
  "record",
  "recycle",
  "reduce",
  "reflect",
  "reform",
  "refuse",
  "region",
  "regret",
  "regular",
  "reject",
  "relax",
  "release",
  "relief",
  "rely",
  "remain",
  "remember",
  "remind",
  "remove",
  "render",
  "renew",
  "rent",
  "reopen",
  "repair",
  "repeat",
  "replace",
  "report",
  "require",
  "rescue",
  "resemble",
  "resist",
  "resource",
  "response",
  "result",
  "retire",
  "retreat",
  "return",
  "reunion",
  "reveal",
  "review",
  "reward",
  "rhythm",
  "rib",
  "ribbon",
  "rice",
  "rich",
  "ride",
  "ridge",
  "rifle",
  "right",
  "rigid",
  "ring",
  "riot",
  "ripple",
  "risk",
  "ritual",
  "rival",
  "river",
  "road",
  "roast",
  "robot",
  "robust",
  "rocket",
  "romance",
  "roof",
  "rookie",
  "room",
  "rose",
  "rotate",
  "rough",
  "round",
  "route",
  "royal",
  "rubber",
  "rude",
  "rug",
  "rule",
  "run",
  "runway",
  "rural",
  "sad",
  "saddle",
  "sadness",
  "safe",
  "sail",
  "salad",
  "salmon",
  "salon",
  "salt",
  "salute",
  "same",
  "sample",
  "sand",
  "satisfy",
  "satoshi",
  "sauce",
  "sausage",
  "save",
  "say",
  "scale",
  "scan",
  "scare",
  "scatter",
  "scene",
  "scheme",
  "school",
  "science",
  "scissors",
  "scorpion",
  "scout",
  "scrap",
  "screen",
  "script",
  "scrub",
  "sea",
  "search",
  "season",
  "seat",
  "second",
  "secret",
  "section",
  "security",
  "seed",
  "seek",
  "segment",
  "select",
  "sell",
  "seminar",
  "senior",
  "sense",
  "sentence",
  "series",
  "service",
  "session",
  "settle",
  "setup",
  "seven",
  "shadow",
  "shaft",
  "shallow",
  "share",
  "shed",
  "shell",
  "sheriff",
  "shield",
  "shift",
  "shine",
  "ship",
  "shiver",
  "shock",
  "shoe",
  "shoot",
  "shop",
  "short",
  "shoulder",
  "shove",
  "shrimp",
  "shrug",
  "shuffle",
  "shy",
  "sibling",
  "sick",
  "side",
  "siege",
  "sight",
  "sign",
  "silent",
  "silk",
  "silly",
  "silver",
  "similar",
  "simple",
  "since",
  "sing",
  "siren",
  "sister",
  "situate",
  "six",
  "size",
  "skate",
  "sketch",
  "ski",
  "skill",
  "skin",
  "skirt",
  "skull",
  "slab",
  "slam",
  "sleep",
  "slender",
  "slice",
  "slide",
  "slight",
  "slim",
  "slogan",
  "slot",
  "slow",
  "slush",
  "small",
  "smart",
  "smile",
  "smoke",
  "smooth",
  "snack",
  "snake",
  "snap",
  "sniff",
  "snow",
  "soap",
  "soccer",
  "social",
  "sock",
  "soda",
  "soft",
  "solar",
  "soldier",
  "solid",
  "solution",
  "solve",
  "someone",
  "song",
  "soon",
  "sorry",
  "sort",
  "soul",
  "sound",
  "soup",
  "source",
  "south",
  "space",
  "spare",
  "spatial",
  "spawn",
  "speak",
  "special",
  "speed",
  "spell",
  "spend",
  "sphere",
  "spice",
  "spider",
  "spike",
  "spin",
  "spirit",
  "split",
  "spoil",
  "sponsor",
  "spoon",
  "sport",
  "spot",
  "spray",
  "spread",
  "spring",
  "spy",
  "square",
  "squeeze",
  "squirrel",
  "stable",
  "stadium",
  "staff",
  "stage",
  "stairs",
  "stamp",
  "stand",
  "start",
  "state",
  "stay",
  "steak",
  "steel",
  "stem",
  "step",
  "stereo",
  "stick",
  "still",
  "sting",
  "stock",
  "stomach",
  "stone",
  "stool",
  "story",
  "stove",
  "strategy",
  "street",
  "strike",
  "strong",
  "struggle",
  "student",
  "stuff",
  "stumble",
  "style",
  "subject",
  "submit",
  "subway",
  "success",
  "such",
  "sudden",
  "suffer",
  "sugar",
  "suggest",
  "suit",
  "summer",
  "sun",
  "sunny",
  "sunset",
  "super",
  "supply",
  "supreme",
  "sure",
  "surface",
  "surge",
  "surprise",
  "surround",
  "survey",
  "suspect",
  "sustain",
  "swallow",
  "swamp",
  "swap",
  "swarm",
  "swear",
  "sweet",
  "swift",
  "swim",
  "swing",
  "switch",
  "sword",
  "symbol",
  "symptom",
  "syrup",
  "system",
  "table",
  "tackle",
  "tag",
  "tail",
  "talent",
  "talk",
  "tank",
  "tape",
  "target",
  "task",
  "taste",
  "tattoo",
  "taxi",
  "teach",
  "team",
  "tell",
  "ten",
  "tenant",
  "tennis",
  "tent",
  "term",
  "test",
  "text",
  "thank",
  "that",
  "theme",
  "then",
  "theory",
  "there",
  "they",
  "thing",
  "this",
  "thought",
  "three",
  "thrive",
  "throw",
  "thumb",
  "thunder",
  "ticket",
  "tide",
  "tiger",
  "tilt",
  "timber",
  "time",
  "tiny",
  "tip",
  "tired",
  "tissue",
  "title",
  "toast",
  "tobacco",
  "today",
  "toddler",
  "toe",
  "together",
  "toilet",
  "token",
  "tomato",
  "tomorrow",
  "tone",
  "tongue",
  "tonight",
  "tool",
  "tooth",
  "top",
  "topic",
  "topple",
  "torch",
  "tornado",
  "tortoise",
  "toss",
  "total",
  "tourist",
  "toward",
  "tower",
  "town",
  "toy",
  "track",
  "trade",
  "traffic",
  "tragic",
  "train",
  "transfer",
  "trap",
  "trash",
  "travel",
  "tray",
  "treat",
  "tree",
  "trend",
  "trial",
  "tribe",
  "trick",
  "trigger",
  "trim",
  "trip",
  "trophy",
  "trouble",
  "truck",
  "true",
  "truly",
  "trumpet",
  "trust",
  "truth",
  "try",
  "tube",
  "tuition",
  "tumble",
  "tuna",
  "tunnel",
  "turkey",
  "turn",
  "turtle",
  "twelve",
  "twenty",
  "twice",
  "twin",
  "twist",
  "two",
  "type",
  "typical",
  "ugly",
  "umbrella",
  "unable",
  "unaware",
  "uncle",
  "uncover",
  "under",
  "undo",
  "unfair",
  "unfold",
  "unhappy",
  "uniform",
  "unique",
  "unit",
  "universe",
  "unknown",
  "unlock",
  "until",
  "unusual",
  "unveil",
  "update",
  "upgrade",
  "uphold",
  "upon",
  "upper",
  "upset",
  "urban",
  "urge",
  "usage",
  "use",
  "used",
  "useful",
  "useless",
  "usual",
  "utility",
  "vacant",
  "vacuum",
  "vague",
  "valid",
  "valley",
  "valve",
  "van",
  "vanish",
  "vapor",
  "various",
  "vast",
  "vault",
  "vehicle",
  "velvet",
  "vendor",
  "venture",
  "venue",
  "verb",
  "verify",
  "version",
  "very",
  "vessel",
  "veteran",
  "viable",
  "vibrant",
  "vicious",
  "victory",
  "video",
  "view",
  "village",
  "vintage",
  "violin",
  "virtual",
  "virus",
  "visa",
  "visit",
  "visual",
  "vital",
  "vivid",
  "vocal",
  "voice",
  "void",
  "volcano",
  "volume",
  "vote",
  "voyage",
  "wage",
  "wagon",
  "wait",
  "walk",
  "wall",
  "walnut",
  "want",
  "warfare",
  "warm",
  "warrior",
  "wash",
  "wasp",
  "waste",
  "water",
  "wave",
  "way",
  "wealth",
  "weapon",
  "wear",
  "weasel",
  "weather",
  "web",
  "wedding",
  "weekend",
  "weird",
  "welcome",
  "west",
  "wet",
  "whale",
  "what",
  "wheat",
  "wheel",
  "when",
  "where",
  "whip",
  "whisper",
  "wide",
  "width",
  "wife",
  "wild",
  "will",
  "win",
  "window",
  "wine",
  "wing",
  "wink",
  "winner",
  "winter",
  "wire",
  "wisdom",
  "wise",
  "wish",
  "witness",
  "wolf",
  "woman",
  "wonder",
  "wood",
  "wool",
  "word",
  "work",
  "world",
  "worry",
  "worth",
  "wrap",
  "wreck",
  "wrestle",
  "wrist",
  "write",
  "wrong",
  "yard",
  "year",
  "yellow",
  "you",
  "young",
  "youth",
  "zebra",
  "zero",
  "zone",
  "zoo"
];




function mnemonicToHex(mnemonic) {
    var words = mnemonic.split(' ')

    if (words.length % 3 !== 0) return false

    var wordlist = this.wordlist
    var belongToList = words.every(function (word) {
        return wordlist.indexOf(word) > -1
    })

    if (!belongToList) return false

    // convert word indices to 11 bit binary strings
    var bits = words.map(function (word) {
        var index = wordlist.indexOf(word)
        return lpad(index.toString(2), '0', 11)
    }).join('')

    // split the binary string into ENT/CS
    var dividerIndex = Math.floor(bits.length / 33) * 32
    var entropy = bits.slice(0, dividerIndex)
    var checksum = bits.slice(dividerIndex)

    // calculate the checksum and compare
    var entropyBytes = entropy.match(/(.{1,8})/g).map(function (bin) {
        return parseInt(bin, 2)
    })


    return Bitcoin2.convert.bytesToHex(entropyBytes);

}

function bytesToBinary(bytes) {
    return bytes.map(function (x) {
        return lpad(x.toString(2), '0', 8)
    }).join('');
}

function lpad(str, padString, length) {
    while (str.length < length) str = padString + str;
    return str;
}
