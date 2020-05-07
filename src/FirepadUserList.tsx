import { Component } from "react";

export type FirebaseRef = any

export class FirepadUserList extends Component {
  ref_: FirebaseRef;
  userId_: any;
  place_: any;
  firebaseCallbacks_: any[];
  hasName_: boolean;
  displayName_: any;
  userList_: any;

  constructor(ref, place, userId, displayName) {
    super();
    this.ref_ = ref;
    this.userId_ = userId;
    this.place_ = place;
    this.firebaseCallbacks_ = [];

    var self = this;
    this.hasName_ = !!displayName;
    this.displayName_ =
      displayName || "Guest " + Math.floor(Math.random() * 1000);

    this.firebaseOn_(ref.root.child(".info/connected"), "value", function (s) {
      if (s.val() === true && self.displayName_) {
        var nameRef = ref.child(self.userId_).child("name");
        nameRef.onDisconnect().remove();
        nameRef.set(self.displayName_);
      }
    });

    this.userList_ = this.makeUserList_();
    place.appendChild(this.userList_);
  }

  dispose() {
    this.removeFirebaseCallbacks_();
    this.ref_.child(this.userId_).child("name").remove();

    this.place_.removeChild(this.userList_);
  }

  makeUserList_() {
    return elt(
      "div",
      [
        this.makeHeading_(),
        elt(
          "div",
          [this.makeUserEntryForSelf_(), this.makeUserEntriesForOthers_()],
          { class: "firepad-userlist-users" }
        ),
      ],
      { class: "firepad-userlist" }
    );
  }

  makeHeading_() {
    var counterSpan = elt("span", "0");
    this.firebaseOn_(this.ref_, "value", function (usersSnapshot) {
      setTextContent(counterSpan, "" + usersSnapshot.numChildren());
    });

    return elt(
      "div",
      [elt("span", "ONLINE ("), counterSpan, elt("span", ")")],
      {
        class: "firepad-userlist-heading",
      }
    );
  }

  makeUserEntryForSelf_() {
    var myUserRef = this.ref_.child(this.userId_);

    var colorDiv = elt("div", null, {
      class: "firepad-userlist-color-indicator",
    });
    this.firebaseOn_(myUserRef.child("color"), "value", function (
      colorSnapshot
    ) {
      var color = colorSnapshot.val();
      if (isValidColor(color)) {
        colorDiv.style.backgroundColor = color;
      }
    });

    var nameInput = elt("input", null, {
      type: "text",
      class: "firepad-userlist-name-input",
    });
    nameInput.value = this.displayName_;

    var nameHint = elt("div", "ENTER YOUR NAME", {
      class: "firepad-userlist-name-hint",
    });
    if (this.hasName_) nameHint.style.display = "none";

    // Update Firebase when name changes.
    var self = this;
    on(nameInput, "change", function (e) {
      var name = nameInput.value || "Guest " + Math.floor(Math.random() * 1000);
      myUserRef.child("name").onDisconnect().remove();
      myUserRef.child("name").set(name);
      nameHint.style.display = "none";
      nameInput.blur();
      self.displayName_ = name;
      stopEvent(e);
    });

    var nameDiv = elt("div", [nameInput, nameHint]);

    return elt("div", [colorDiv, nameDiv], {
      class: "firepad-userlist-user " + "firepad-user-" + this.userId_,
    });
  }

  makeUserEntriesForOthers_() {
    var self = this;
    var userList = elt("div");
    var userId2Element = {};

    function updateChild(userSnapshot, prevChildName) {
      var userId = userSnapshot.key;
      var div = userId2Element[userId];
      if (div) {
        userList.removeChild(div);
        delete userId2Element[userId];
      }
      var name = userSnapshot.child("name").val();
      if (typeof name !== "string") {
        name = "Guest";
      }
      name = name.substring(0, 20);

      var color = userSnapshot.child("color").val();
      if (!isValidColor(color)) {
        color = "#ffb";
      }

      var colorDiv = elt("div", null, {
        class: "firepad-userlist-color-indicator",
      });
      colorDiv.style.backgroundColor = color;

      var nameDiv = elt("div", name || "Guest", {
        class: "firepad-userlist-name",
      });

      var userDiv = elt("div", [colorDiv, nameDiv], {
        class: "firepad-userlist-user " + "firepad-user-" + userId,
      });
      userId2Element[userId] = userDiv;

      if (userId === self.userId_) {
        // HACK: We go ahead and insert ourself in the DOM, so we can easily order other users against it.
        // But don't show it.
        userDiv.style.display = "none";
      }

      var nextElement = prevChildName
        ? userId2Element[prevChildName].nextSibling
        : userList.firstChild;
      userList.insertBefore(userDiv, nextElement);
    }

    this.firebaseOn_(this.ref_, "child_added", updateChild);
    this.firebaseOn_(this.ref_, "child_changed", updateChild);
    this.firebaseOn_(this.ref_, "child_moved", updateChild);
    this.firebaseOn_(this.ref_, "child_removed", function (removedSnapshot) {
      var userId = removedSnapshot.key;
      var div = userId2Element[userId];
      if (div) {
        userList.removeChild(div);
        delete userId2Element[userId];
      }
    });

    return userList;
  }

  firebaseOn_(ref: FirebaseRef, eventType: string, callback: Function, context?: any) {
    this.firebaseCallbacks_.push({
      ref: ref,
      eventType: eventType,
      callback: callback,
      context: context,
    });
    ref.on(eventType, callback, context);
    return callback;
  }

  firebaseOff_(ref: FirebaseRef, eventType: string, callback: Function, context?: any) {
    ref.off(eventType, callback, context);
    for (var i = 0; i < this.firebaseCallbacks_.length; i++) {
      var l = this.firebaseCallbacks_[i];
      if (
        l.ref === ref &&
        l.eventType === eventType &&
        l.callback === callback &&
        l.context === context
      ) {
        this.firebaseCallbacks_.splice(i, 1);
        break;
      }
    }
  }

  removeFirebaseCallbacks_() {
    for (var i = 0; i < this.firebaseCallbacks_.length; i++) {
      var l = this.firebaseCallbacks_[i];
      l.ref.off(l.eventType, l.callback, l.context);
    }
    this.firebaseCallbacks_ = [];
  }
}
