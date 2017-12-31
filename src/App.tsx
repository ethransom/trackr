import * as React from 'react';
import './App.css';

class App extends React.Component {
  render() {
    return (
      <div className="app">
        <header>
          <h1>Trackr</h1>
        </header>
        <Day/>
      </div>
    );
  }
}

enum ActivityType {
  Blank,
  Sleep,
  School,
  DatingOrPartner,
  Work,
  Internet,
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

class Day extends React.Component {
  state: {
    hours: BlockModel[],
  }

  private activityChooser: ActivityChooser | null;

  private onClick(type: ActivityType, i: number) {
    console.log("click");
    if (!this.activityChooser) {
      console.warn("tried to change Block before ActivityChooser was ready");
      return;
    }

    this.activityChooser.show().then((type) => {
      let clone = this.state.hours.slice(0); 
      clone[i].type = type;
      this.setState({hours: clone});
    });
  }

  componentWillMount() {
    let hours = [
      new BlockModel(ActivityType.Blank),
      new BlockModel(ActivityType.Sleep),
      new BlockModel(ActivityType.School),
      new BlockModel(ActivityType.DatingOrPartner),
      new BlockModel(ActivityType.Work),
      new BlockModel(ActivityType.Internet),
      new BlockModel(ActivityType.Social),
      new BlockModel(ActivityType.Gaming),
      new BlockModel(ActivityType.Family),
      new BlockModel(ActivityType.Travel),
      new BlockModel(ActivityType.Errands),
      new BlockModel(ActivityType.Exercise),
    ];

    while (hours.length < 24) {
      hours.push(new BlockModel());
    }

    this.setState({hours: hours});
  }

  render() {
    return (
      <section className="day">
        {this.state.hours.map((block, i) => {
          return <Block 
            block={block}
            hour={i}
            onClick={(type) => this.onClick(type, i)}/> 
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
    onClick: (type: ActivityType) => void,
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
        <Activity onClick={this.props.onClick} type={this.props.block.type}/>
      </div>
    )
  }
}

class Activity extends React.Component {
  props: {
    type: ActivityType,
    onClick: (type: ActivityType) => any,
  }

  render() {
    let activity = ActivityType[this.props.type];

    let className = "activity " + activity;

    return (
      // TODO: key
      <div onClick={() => this.props.onClick(this.props.type)} className={className}>
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
