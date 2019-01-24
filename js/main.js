//initialize fastclick
if ('addEventListener' in document) {
  document.addEventListener('DOMContentLoaded', function() {
    FastClick.attach(document.body);
  }, false);
}

function debug__logout() {
  firebase.auth().signOut()
}

function debug__anim(anim, anim2) {
  var pc = $('.pyramid-container')
  var animation = "animated " + anim
  pc.addClass(animation)
  pc.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    if (anim2) {
      pc.removeClass(animation)
      pc.addClass("animated " + anim2)
    }
  })
}

function generateYds() {
  var g = ["5.8", "5.9"]
  var limit = 14
  var current = 10
  var letters = ['a', 'b', 'c', 'd']
  while (current !== limit + 1) {
    for (var i = 0; i < letters.length; i++) {
      g.push("5." + current + letters[i])
    }
    current++
  }
  return g
}

function generateFrench() {
  var g = ["4", "5"]
  var limit = 8
  var current = 6
  var letters = ['a', 'b', 'c']
  while (current !== limit + 1) {
    for (var i = 0; i < letters.length; i++) {
      g.push(current + letters[i])
      g.push(current + letters[i] + "+")
    }
    current++
  }
  return g
}

function generateHueco() {
  var g = ["VB"]
  var limit = 15
  var current = 0
  while (current !== limit + 1) {
    g.push("V" + current)
    current++
  }
  return g
}

function initialData() {
  return {
    email: null,
    isConnected: true,
    justRegistered: false,
    userId: null,
    mode: "loading",
    grades: generateHueco(),
    gradingSystem: null,
    requirements: [],
    db: TAFFY(),
    angleChart: null,
    holdTypeChart: null,
    routeWorkChart: null,
    climbType: "boulder",
    routeOnsight: null,
    boulderOnsight: null,
    dateFormat: 'MM/DD/YYYY',
    errors: [],
  }
}

// Initialize Firebase
var config = {
  apiKey: "AIzaSyC2nJvO4tzuUlfajYXEgKkh8j9Ofn-9j2c",
    authDomain: "peaklist-fork.firebaseapp.com",
    databaseURL: "https://peaklist-fork.firebaseio.com",
  storageBucket: "",
}

firebase.initializeApp(config)

var database = firebase.database()

var app = new Vue({
  el: '#tickList',
  data: initialData(),
  computed: {
    routes: function () {
      return _.sortBy(this.db().get(), function(o) { return o.grade })
    },
    angles: function() {
      return [
        {id: "slab", statName: "SLAB", displayName: "Slab", color: "#0face1"},
        {id: "vertical", statName: "VERT", displayName: "Vertical", color: "#ef5728"},
        {id: "slight-overhang", statName: "SLGT", displayName: "Slight overhang (10-20&deg;)", color: "#d2d1b3"},
        {id: "moderate-overhang", statName: "MODR", displayName: "Moderate overhang (30-35&deg;)", color: "#363731"},
        {id: "steep-overhang", statName: "HEVY", displayName: "Heavy overhang (~45&deg;)", color: "#fcea24"},
        {id: "roof", statName: "ROOF", displayName: "Roof", color: "#e2e2e2"}
      ]
    },
    holdTypes: function() {
      return [
        {id: "crimp", statName: "CRMP", displayName: "Crimp", color: "#0face1"},
        {id: "jib", statName: "JIB", displayName: "Jib", color: "#ef5728"},
        {id: "jug", statName: "JUG", displayName: "Jug", color: "#d2d1b3"},
        {id: "mono", statName: "MONO", displayName: "Mono", color: "#363731"},
        {id: "pinch", statName: "PNCH", displayName: "Pinch", color: "#fcea24"},
        {id: "pocket", statName: "POCK", displayName: "Pocket", color: "#e2e2e2"},
        {id: "sidepull", statName: "SIDE", displayName: "Sidepull", color: "#e3cb29"},
        {id: "sloper", statName: "SLOP", displayName: "Sloper", color: "#aa231f"},
        {id: "undercling", statName: "UNDR", displayName: "Undercling", color: "#000"}
      ]
    },
    routeWorks: function() {
		if(app.climbType === 'route') {
			return [        
				{id: "onsight", statName: "ONST", displayName: "On-sight", color: "#0face1"},
				{id: "flash", statName: "FLSH", displayName: "Flash", color: "#e3cb29"},
				{id: "2nd", statName: "2ND", displayName: "2nd try", color: "#aa231f"},
				{id: "3+", statName: "3+", displayName: "3 or more tries", color: "#fcea24"},
			]
		} else {
			return [
				{id: "flash", statName: "FLSH", displayName: "Flash", color: "#0face1"},
				{id: "2nd", statName: "2ND", displayName: "2nd try", color: "#e3cb29"},
				{id: "3rd", statName: "3RD", displayName: "3rd try", color: "#aa231f"},
				{id: "3+", statName: "3+", displayName: "More than 3 tries", color: "#fcea24"},
			]
		}
    },
    filterableGrades: function() {
      return this.db().distinct("grade").sort()
    },
    filterableDates: function() {
		return this.db().distinct('dateSent').sort()
	},
    boulderGrades: function() {
      return generateHueco()
    },
    pyramidSides: function() {
      return 38
    },
  },
  watch: {
    mode: function(value) {
      if (value === "login" || value === "setup") {
        document.querySelector("input[name='username']").focus()
      }
      else if (value === "record") {
        document.querySelector("input[name='routeName']").focus()
      }
    },
    isConnected: function(value) {
      //only back up on reconnect and only if db is not empty
      if (value === true && app.db && app.db().get().length > 0) {
        app.doBackup()
      }
    }
  },
  methods: {
    changeClimbType(e, type) {
      e.preventDefault()
      app.climbType = type
      
      
		
      firebase.database().ref("users/" + app.userId + "/" + type).once('value', function(snapshot) {
        var v = snapshot.val()
        app.gradingSystem = v.gradingSystem
        app.requirements = v.requirements
        app.db = TAFFY(v.data)

        if (v.gradingSystem === "hueco") {
          app.grades = generateHueco()
        }
        else if (v.gradingSystem === "french") {
          app.grades = generateFrench()
        }
        else if (v.gradingSystem === "yds") {
          app.grades = generateYds()
        }

        app.checkPyramidComplete()
        app.calculateStats()

      })
    },
    logout: function(e) {
      e.target.disabled = true
      e.preventDefault()
      //empty state
      firebase.auth().signOut().then(function() {
        app.$data = initialData()
      })
    },
    onFilterChange(e) {
      app.calculateStats(document.getElementById("gradeStatSelector").value, document.getElementById("dateStatSelector").value)
    },
    changeMode: function(mode, e) {
      if (e) {
        e.preventDefault()
      }
      this.mode = mode
    },
    doLogin: function(e) {
      e.target.disabled = true
      e.preventDefault()
      firebase.auth().signInWithEmailAndPassword(e.target.form.username.value, e.target.form.password.value).catch(function(error) {
        alert(error.message)
      })
    },
    onGradeChange: function(e) {
      if(e.target.value === "yds") {
        this.grades = generateYds()
      }
      else {
        this.grades = generateFrench()
      }
    },
    calculatePyramid: function(onSightLevel, climbType) {
      var requirements = []
      var reps = 1
      var grades = this.grades

      if (climbType === "boulder") {
        grades = generateHueco()
      }

      for (var i = 4; i > 0; i--) {
        //start at top of pyramid
        var base = grades[grades.indexOf(onSightLevel) + i]
        requirements.push({grade: base, required: reps})
        reps = reps * 2
      }
      return requirements
    },
    firebaseListen() {
      console.log("LISTEN")
      firebase.database().ref("users/" + app.userId).on('value', function(snapshot) {
        //when new data from firebase server received
        console.log("RECEIVED NEW DATA --- MODE: ", app.climbType)
        var v = snapshot.val()
        console.log(v)

        if (app.climbType === "route") {
          console.log("SET ROUTE DATA")
          app.db = TAFFY(v.route.data)
          app.requirements = v.route.requirements
        }
        else if (app.climbType === "boulder") {
          console.log("SET BOULDER DATA")
          app.db = TAFFY(v.boulder.data)
          app.requirements = v.boulder.requirements
        }

        app.checkPyramidComplete()

        var gss = document.getElementById("gradeStatSelector")
        var dss = document.getElementById("dateStatSelector")
        var arr = []
        
        if(gss) {arr.push(gss.value)} else {arr.push(null)}
        if(dss) {arr.push(dss.value)}
        
        app.calculateStats.apply(null, arr)
        
        
        //if (gss) {
          //app.calculateStats(gss.value)
        //}
        //else {
          //app.calculateStats()
        //}
      })
      firebase.database().ref(".info/connected").on("value", function(snap) {
        if (snap.val() === true) {
          app.isConnected = true
        } else {
          app.isConnected = false
        }
      })
    },
    doBackup: function() {
      if (app.isConnected) {
        firebase.database().ref("users/" + app.userId + "/" + app.climbType).update({
          requirements: app.requirements,
          data: app.db().get(),
        })
      }
    },
    doSetup: function(e) {
      e.target.disabled = true
      e.preventDefault()
      firebase.auth().createUserWithEmailAndPassword(e.target.form.username.value, e.target.form.password.value).catch(function(error) {
        alert(error.message)
        e.target.disabled = false
      })

      app.routeOnsight = e.target.form.onsightLevel.value
      app.boulderOnsight = e.target.form.boulderOnsight.value
      app.gradingSystem = e.target.form.gradingSystem.value
      app.justRegistered = true
    },
    doInitialBackup() {
      firebase.database().ref("users/" + app.userId + "/route").set({
        gradingSystem: app.gradingSystem,
        requirements: app.calculatePyramid(app.routeOnsight),
      })

      firebase.database().ref("users/" + app.userId + "/boulder").set({
        gradingSystem: "hueco",
        requirements: app.calculatePyramid(app.boulderOnsight, "boulder"),
      })
    },
    checkPyramidComplete: function() {
      console.log("CHECK PYRAMID")
      var fulfilled = true
      for (var i = 0; i < this.requirements.length; i++) {
        var r = this.requirements[i]
        var numComplete = this.db({grade: r.grade}).count()

        r.completed = numComplete
        this.requirements.$set(i, _.clone(r))
        if (numComplete < r.required) {
          fulfilled = false
        }
      }

      if (fulfilled) {
        var pc = $('.pyramid-container')
        var animationOut = "animated bounceOut"
        var animationIn = "animated bounceIn"
        var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend'
        var g = this.grades
        var index = g.indexOf(app.requirements[0].grade)
        console.log(app.requirements[0].grade, index, g.length)
        if (index + 1 >= g.length) {
          console.log("Congratulations, you're a real Sharma!")
          return
        }

        pc.addClass(animationOut)

        pc.one(animationEnd, function() {
          pc.removeClass(animationOut)
          app.upgradePyramid()
          pc.addClass(animationIn)
          pc.one(animationEnd, function() {
            pc.removeClass(animationIn)
            app.checkPyramidComplete()
          })
        })
      }
    },
    getGradeChartData: function() {
		gradeChartData = []

		app.grades.forEach(function (val) {
			gradeChartData.push({id: val, statName: val, displayName: val, color: "#363731"})
		})
		
		return gradeChartData
	},
    calculateStat(stat, chartData, chartType, grade, date, showZeroes) {
      /**
        Stats follow these basic rules
        Define a stat (e.g. angle)
        Put that stat in app.data
        Canvas element: id must be stat + Chart (angleChart)
        Computed vue value must be stat + 's' (angles)
      **/
      var labels = []
      var colors = []
      var ctx = document.getElementById(stat + "Chart")
      var data = []
      var options = {}
      for (var i = 0; i < chartData.length; i++) {
        var curr = chartData[i]
        var filter = {}
        filter[stat] = curr.id

        if (grade) {
          filter.grade = grade
        }
        if (date) {
			filter.dateSent = date
		}

        var count = app.db(filter).count()
        if (count > 0 || showZeroes) {
          data.push(count)
          labels.push(curr.statName)
          colors.push(curr.color)
        }
      }

      if (ctx) {
        var c = app[stat + "Chart"]
        if (c) {
          c.data.labels = labels
          c.data.datasets[0].data = data
          c.data.datasets[0].backgroundColor = colors
          c.update()
        }
        else {
          if (chartType === "bar") {
            options = {
              legend: {
                display: false,
              },
              scales: {
                yAxes: [{
                  ticks: {
                    min: 0,
                    maxTicksLimit: 5,
                    callback: function(value) {
                      if(!(value % 1)) {
                        return Number(value).toFixed(0)
                      }
                    }
                  }
                }]
              }
            }
          }

          app[stat + "Chart"] = new Chart(ctx, {
            type: chartType,
            data: {
              labels: labels,
              datasets: [
                {
                  data: data,
                  backgroundColor: colors
                }]
            },
            options: options,
          })
        }
      }
    },
    calculateVStats: function(date, grade) {
		var filter = {}
		var vSum = 0
		var grades = generateHueco()
		
		if(date) { filter.dateSent = date }
		if(grade) {filter.grade = grade}
		
		var data = app.db(filter).get()
		for(var i=0; i<data.length; i++) {
			gradeInt = grades.findIndex(function(element) {
				return element === data[i].grade
			}) - 1

			if(gradeInt <= 0) {gradeInt = 1}
			
			vSum+= gradeInt
		}

		return {vSum:vSum, numClimbs: data.length, vAvg: (data.length===0 ? 0 : (vSum/data.length)) }
	},
	calculateBoulderStats: function(date, grade) {
		var stats = ['vSum', 'vAvg', 'numClimbs']
		var data = {
			labels: [],
			datasets: stats.map( (val,index) => {
				return { 
					label:val, 
					data:[], 
					borderColor:app.holdTypes[index].color,
					fill: false 
				}
			})
		}

		for(var i=0; i<app.filterableDates.length; i++) {
			if(app.filterableDates[i]) {
				data.labels.push(app.filterableDates[i])

				var vStats = app.calculateVStats(app.filterableDates[i])
				for(j=0;j<stats.length;j++) {
					data.datasets[j].data.push(vStats[stats[j]])
				}
			}
		}
		
		vStats = app.calculateVStats(grade, date)
		for(var i=0; i<stats.length; i++) {
			p = document.getElementById(stats[i])
			if(p) {
				p.innerText = Math.round(vStats[stats[i]] * 100) / 100
			}
		}
		
		ctx = document.getElementById(stats[0]+'Chart')
		
		if(ctx) {
			c = app[stats[0]+'Chart']
			if(c) {
				c.data = data
				c.update()
			} else {
				app[stats[0]+'Chart'] = new Chart(ctx, {
					type: 'line',
					data: data,
					options: {}
				})
			}
		}
	},
    calculateStats: function(grade, date) {
      setTimeout(function(grade, date) {
        app.calculateStat("angle", app["angles"], "bar", grade, date, true)
        app.calculateStat("holdType", app['holdTypes'], "bar", grade, date, true)
        app.calculateStat("routeWork", app['routeWorks'], "doughnut", grade, date)
        app.calculateStat("grade", app.getGradeChartData(), "bar", grade, date, true)
        if(app.climbType === 'boulder') {
			app.calculateBoulderStats()
		}
      }.bind(this, grade,date), 100)
    },
    upgradePyramid: function() {
      //find highest grade in req
      var r = this.requirements
      var g = this.grades
      var index = g.indexOf(r[0].grade)

      //New tip
      this.requirements.unshift({
        grade: g[index + 1],
        required: 1
      })
      this.requirements.pop()

      for (var i = 1; i <= 3; i++) {
        var increment = i === 3 ? 4 : i
        this.requirements[i].required = this.requirements[i].required + increment
      }

      app.doBackup()
    },
    recordSend: function(e) {
      e.preventDefault()
      var data = $('#sendRecorder').serializeArray().reduce(
        function(obj, item) {
          obj[item.name] = item.value
          return obj
        }, {})
        
      this.errors = []
      dataDate = data['dateSent']
      if(dataDate === '' || moment(dataDate, this.dateFormat, true).isValid()) {
		  this.db.insert(data)
		  app.doBackup()
		  $('#sendRecorder')[0].reset()
	  } else {
		  this.errors.push("Something's wrong with your date. It's gotta be in "+this.dateFormat + " form.")
	  }
    },
    setToToday: function(target) {
		$(target).val(moment().format(this.dateFormat))
	},
  }
})

firebase.auth().onAuthStateChanged(function(user) {
  app.mode = "loading"
  if (user) {
    app.userId = user.uid
    app.email = user.email
    if (app.justRegistered) {
      console.log("JUST REGISTERED")
      app.doInitialBackup()
      app.justRegistered = false
    }
    app.changeMode("record")
    app.firebaseListen()
  }
  else {
    app.mode = "landing"
  }
})
