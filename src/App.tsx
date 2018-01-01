import * as React from 'react';
import * as firebase from 'firebase';
import * as moment from 'moment';

// const firebase = require('firebase');
// import * as firebaseui from 'firebaseui';

import './App.css';

var config = {
  apiKey: "AIzaSyDajRL9nYDdGEQDFXIw__6nYa9U-ktksY4",
  authDomain: "trackr-392e8.firebaseapp.com",
  databaseURL: "https://trackr-392e8.firebaseio.com",
  projectId: "trackr-392e8",
  storageBucket: "",
  messagingSenderId: "770319283484"
};
firebase.initializeApp(config);

let database = firebase.database;
if (!database) {
  alert("unable to initialize database");
  throw new Error("unable to initialize database");
}

let db = database();

class App extends React.Component {
  state = {
    date: moment(),
  };

  render() {
    return (
      <div className="app">
        <header>
          <h1>Trackr</h1>
        </header>
        <DatePicker 
          date={this.state.date} 
          onChange={(m) => this.setState({date: m})}/>

        <Day date={this.state.date.format("YYYY-MM-DD")}/>
      </div>
    );
  }
}

class DatePicker extends React.Component {
  props: {
    date: moment.Moment,
    onChange: (m: moment.Moment) => void,
  };

  render() {
    return (
      <div className="datePicker">
        <a className="dateChanger"
          onClick={() => this.props.onChange(this.props.date.subtract(1, "day"))}>

          Prev
        </a>

        <div className="dateDisplay">
          {this.props.date.format("MMM Do, YYYY")}
        </div>

        <a className="dateChanger"
          onClick={() => this.props.onChange(this.props.date.add(1, "day"))}>
          Next
        </a>
      </div>
    )
  }
}
// class FirebaseUI extends React.Component {
//   componentWillMount() {
//     // FirebaseUI config.
//     var uiConfig = {
//       signInSuccessUrl: '<url-to-redirect-to-on-success>',
//       signInOptions: [
//         // Leave the lines as is for the providers you want to offer your users.
//         firebase.auth.GoogleAuthProvider.PROVIDER_ID,
//         firebase.auth.FacebookAuthProvider.PROVIDER_ID,
//         firebase.auth.TwitterAuthProvider.PROVIDER_ID,
//         firebase.auth.GithubAuthProvider.PROVIDER_ID,
//         firebase.auth.EmailAuthProvider.PROVIDER_ID,
//         firebase.auth.PhoneAuthProvider.PROVIDER_ID
//       ],
//       // Terms of service url.
//       tosUrl: '<your-tos-url>'
//     };

//     // Initialize the FirebaseUI Widget using Firebase.
//     var ui = new firebaseui.auth.AuthUI(firebase.auth());
//     // The start method will wait until the DOM is loaded.
//     ui.start('#firebaseui-auth-container', uiConfig);
//   }
// }

enum ActivityType {
  Blank,
  Sleep,
  School,
  DatingOrPartner,
  Work,
  Internet,
  Projects,
  Meals,
  Social,
  Gaming,
  Family,
  Travel,
  Errands,
  Exercise,
}

class BlockModel {
  type: ActivityType;

  constructor(t = ActivityType.Blank) {
    this.type = t;
  }

  toString() {
    return ActivityType[this.type];
  }
}

let defaultHours = [
  new BlockModel(ActivityType.Sleep), // 12am
  new BlockModel(ActivityType.Sleep), // 1am
  new BlockModel(ActivityType.Sleep), // 2am
  new BlockModel(ActivityType.Sleep), // 3am
  new BlockModel(ActivityType.Sleep), // 4am
  new BlockModel(ActivityType.Sleep), // 5am
  new BlockModel(ActivityType.Sleep), // 6am
  new BlockModel(ActivityType.Sleep), // 7am
  new BlockModel(ActivityType.Sleep), // 8am
  new BlockModel(ActivityType.Meals), // 9am
  new BlockModel(ActivityType.Blank), // 10am
  new BlockModel(ActivityType.Blank), // 11am
  new BlockModel(ActivityType.Blank), // 12am
  new BlockModel(ActivityType.Meals), // 1pm
  new BlockModel(ActivityType.Blank), // 2pm
  new BlockModel(ActivityType.Blank), // 3pm
  new BlockModel(ActivityType.Blank), // 4pm
  new BlockModel(ActivityType.Blank), // 5pm
  new BlockModel(ActivityType.Blank), // 6pm
  new BlockModel(ActivityType.Meals), // 7pm
  new BlockModel(ActivityType.Blank), // 8pm
  new BlockModel(ActivityType.Blank), // 9pm
  new BlockModel(ActivityType.Blank), // 10pm
  new BlockModel(ActivityType.Sleep), // 11pm
];

interface DayProps {
  date: string,
}

class Day extends React.Component<DayProps, {}> {
  state = {
    hours: [] as BlockModel[],
    loading: true,
  }

  private activityChooser: ActivityChooser | null;

  private onClick(i: number) {
    if (!this.activityChooser) {
      console.warn("tried to change Block before ActivityChooser was ready");
      return;
    }

    this.activityChooser.show().then((type) => {
      this.setActivity(i, type);
    });
  }

  private dragType: ActivityType | null = null;

  private startDrag = (i: number) => {
    const type = this.state.hours[i].type;

    this.dragType = type;

    document.addEventListener("mouseup", () => {
      this.dragType = null;
    })
  }

  private dragOver = (i: number) => {
    if (this.dragType === null) {
      return;
    }

    this.setActivity(i, this.dragType);
  }

  private setActivity(i: number, type: ActivityType) {
    let clone = this.state.hours.slice(0); 
    clone[i].type = type;
    this.setState({hours: clone});
    db.ref(`days/${this.props.date}`).set(clone).then(() => {
      console.log("database value updated");
    })
  }

  componentWillMount() {
    this.loadDate();
  }

  componentDidUpdate(prevProps: DayProps, nextState: {}) {
    if (this.props.date === prevProps.date) {
      return;
    }

    this.loadDate();
  }

  private loadDate() {
    this.setState({
      hours: [],
      loading: true,
    });

    db.ref(`days/${this.props.date}`).on('value', (snapshot) => {
      if (!snapshot || !snapshot.exists()) {
        console.warn("doesn't exist, returning");
        return;
      }
      this.setState({
        hours: snapshot.val() as ActivityType[],
        loading: false,
      });
    });

    db.ref("days").once('value', (snapshot) => {
      if (!snapshot.hasChild(this.props.date)) {
        db.ref(`days/${this.props.date}`).set(defaultHours).then(() => {
          console.log("set default value");
        });
        this.setState({
          hours: defaultHours,
          loading: false,
        })
      }
    });
  }

  render() {
    return (
      <section className="day">
        {this.state.hours.map((block, i) => {
          return <Block 
            block={block}
            hour={i}
            onClick={() => this.onClick(i)}
            onMouseDown={() => this.startDrag(i)}
            onMouseEnter={() => this.dragOver(i)}/> 
        })}

        <ActivityChooser ref={(ac) => this.activityChooser = ac}/>
      </section>
    )
  }
}

class Block extends React.Component {
  props: {
    block: BlockModel,
    hour: number,
    onClick: () => void,
    onMouseDown: () => void,
    onMouseEnter: () => void,
  }

  private renderHour(hour: number) {
    if (hour == 0) {
      return "12 am";
    } else if (hour > 12) {
      hour -= 12;
      return `${hour} pm`;
    } else {
      return `${hour} am`;
    }
  }

  render() {
    return (
      <div className="block">
        <span className="hour">
          {this.renderHour(this.props.hour)} - {this.renderHour(this.props.hour + 1)}
        </span>
        <Activity 
          onClick={this.props.onClick} 
          onMouseDown={this.props.onMouseDown}
          onMouseEnter={this.props.onMouseEnter}
          type={this.props.block.type}/>
      </div>
    )
  }
}

class Activity extends React.Component {
  props: {
    type: ActivityType,
    onClick: (type: ActivityType) => void,
    onMouseDown?: () => void,
    onMouseEnter?: () => void,
  }

  render() {
    let activity = ActivityType[this.props.type];

    let className = "activity noselect " + activity;

    return (
      // TODO: key
      <div 
        className={className}
        onClick={() => this.props.onClick(this.props.type)}
        onMouseDown={() => this.props.onMouseDown && this.props.onMouseDown()}
        onMouseEnter={() => this.props.onMouseEnter && this.props.onMouseEnter()}>
        {activity}
      </div>
    )
  }
}

class ModalContainer extends React.Component {
  render() {
    return (
      <div className="modalContainer">
        {this.props.children}
      </div>
    )
  }
}

// https://github.com/Microsoft/TypeScript/issues/17198
const allActivities = Object.keys(ActivityType)
  .filter(k => typeof ActivityType[k as any] !== "number")
  .map(k => Number(k)) as ActivityType[];

class ActivityChooser extends React.Component {
  state = {
    active: false,
    activities: allActivities,
  };

  onSelectCallback: (value: ActivityType) => void;

  show() {
    this.setState({active: true});

    return new Promise<ActivityType>((resolve, reject) => {
      this.onSelectCallback = resolve;
    });
  }

  private onSelect = (type: ActivityType) => {
    this.setState({active: false});

    this.onSelectCallback(type);
  }

  render () {
    if (!this.state.active) {
      return null;
    }

    return (
      <ModalContainer>
        <div className="activityChooser">
          {this.state.activities.map(
            activity => <Activity 
              onClick={(type) => this.onSelect(type)} 
              type={activity}/>
          )}
        </div>
      </ModalContainer>
    );
  }
}

export default App;
