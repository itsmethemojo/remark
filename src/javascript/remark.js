function Remark (config) {
  this.readConfig(config)
  this.initialize()
  this.listen()
}

Remark.prototype.readConfig = function (config) {
  this.apiUrl = config.apiUrl
  this.indexPath = config.indexPath
  this.addPath = config.addPath
  this.addButtonId = config.addButtonId ? '#' + config.addButtonId : '#add'
  this.containerDivId = config.containerDivId ? '#' + config.containerDivId : '#items'
  this.filterInputId = config.filterInputId ? '#' + config.filterInputId : '#filter'
  this.sortTypeSelectSelector = config.sortTypeSelectSelector ? config.sortTypeSelectSelector : 'input[type=radio][name=sortType]'
  this.firstEntriesCount = 30
  this.wto = 0
  this.filter = $(this.filterInputId).val()
  this.remarks = $(this.remarkSelectId).val()
  this.clicks = $(this.clickSelectId).val()
  this.bookmarks = localStorage.getObject('bookmarks') || []
  this.bookmarksRemarked = localStorage.getObject('bookmarksSortedByRemarks') || []
  this.bookmarksClicked = localStorage.getObject('bookmarksSortedByClicks') || []
  this.maxCount = this.getUrlParameter('items')
  // TODO read it from select
  this.sortType = 'date'
  this.sharedRemark = this.getUrlParameter('remark')
}

Remark.prototype.listen = function () {
  var self = this

  // react on filterfield typing
  $(self.filterInputId).on('input', function (event) {
    self.filter = $(this).val().toLowerCase().trim()

    clearTimeout(self.wto)
    self.wto = setTimeout(function () {
      self.printBookmarks()
    }, 500)
  })

  // react on changing sort type
  $(this.sortTypeSelectSelector).change(function () {
    self.setSortType(this.value)
    clearTimeout(self.wto)
    self.wto = setTimeout(function () {
      self.printBookmarks()
    }, 500)
  })

  // add button click target
  $(self.addButtonId).click(function () {
    location.href = self.addPath
  })
}

Remark.prototype.setSortType = function (sortType) {
  if (sortType === 'remarks' || sortType === 'clicks') {
    this.sortType = sortType
  } else {
    this.sortType = 'date'
  }
}

Remark.prototype.initialize = function () {
  if (this.sharedRemark) {
    location.href = this.addPath + '?remark=' + this.sharedRemark
  }

  if (this.bookmarks.length !== 0) {
    // just print the old stuff at first
    this.printBookmarks()
  }
  this.refresh()
}

Remark.prototype.refresh = function () {
  console.log('refreshing')
  var self = this
  var jsonUrl = self.apiUrl
  $.getJSON(jsonUrl, function (bookmarks) {
    self.storeBookmarks(bookmarks)
    self.printBookmarks()
  }).fail(function (jqXHR) {
    if (jqXHR.status === 401) {
      self.login()
    }
  })
}

Remark.prototype.printBookmarks = function () {
  console.log('printing')
  var self = this
  var html = ''
  var bookmarksHtmlCreated = 0
  var previousId = 0
  var bookmarks = self.getBookmarks()
  for (var i = 0; i < bookmarks.length; i++) {
    if (this.isBookmarkFiltered(bookmarks[i], i === 0 ? { id: null } : bookmarks[previousId])) {
      continue
    }
    if (self.maxCount !== null && self.maxCount === bookmarksHtmlCreated) {
      break
    }
    bookmarksHtmlCreated++
    if (bookmarksHtmlCreated === self.firstEntriesCount) {
      $(self.containerDivId).html(html)
    }
    html += this.printBookmark(bookmarks[i])
    previousId = i
  }
  $(self.containerDivId).html(html)
  $('span.title a').click(function () {
    var $anker = $(this)
    $.post(
      self.apiUrl + 'click/' + $anker.closest('div').data('id') + '/',
      function (result) {
        self.refresh()
      }
    )
  })
}

Remark.prototype.printBookmark = function (bookmark) {
  var fourDivs = '<div></div><div></div><div></div><div></div>'
  return '<div data-id="' + bookmark.id + '" class="row item">' +
           '<div class="12 col">' +
           '<span class="date">' + this.extractDate(bookmark.created) + '</span>' +
           '<span class="time">' + this.extractTime(bookmark.created) + '</span>' +
           '<div class="icon remark level' + this.getRemarkVisibility(bookmark.remarks) + '">' + fourDivs + '</div>' +
           '<div class="icon click level' + this.getClickVisibility(bookmark.clicks) + '">' + fourDivs + '</div>' +
           '<div data-id="' + bookmark.id + '" class="website">' +
           '<span class="domain">' + bookmark.domain + '</span>' +
           '<span class="title">' +
           '<a target="_blank" href="' + bookmark.url + '">' +
           (bookmark.customtitle === '' ? bookmark.title : bookmark.customtitle) +
           '</a>' +
           '</span>' +
           '</div>' +
           '</div>' +
           '</div>'
}

Remark.prototype.storeBookmarks = function (bookmarks) {
  var self = this
  self.bookmarks = bookmarks
  localStorage.setObject('bookmarks', self.bookmarks)

  // sort bookmarks
  var remarkHighCount = 0
  var clickedHighCount = 0
  for (var i = 0; i < self.bookmarks.length; i++) {
    if (bookmarks[i].remarks > remarkHighCount) {
      remarkHighCount = bookmarks[i].remarks
    }
    if (bookmarks[i].clicks > clickedHighCount) {
      clickedHighCount = bookmarks[i].clicks
    }
  }

  var sortedRemarkedEntries = []
  var sortedClickedEntries = []

  var alreadyRemarkedEntries = new Map()
  var alreadyClickedEntries = new Map()

  var maxC = remarkHighCount
  if (Number(clickedHighCount) > Number(remarkHighCount)) {
    maxC = clickedHighCount
  }

  console.log(remarkHighCount, clickedHighCount, maxC)

  for (var j = maxC; j >= 0; j--) {
    for (var k = 0; k < self.bookmarks.length; k++) {
      if (bookmarks[k].remarks === j && !alreadyRemarkedEntries.has(bookmarks[k].id)) {
        sortedRemarkedEntries.push(bookmarks[k])
        alreadyRemarkedEntries.set(bookmarks[k].id)
      }
      if (bookmarks[k].clicks === j && !(alreadyClickedEntries.has(bookmarks[k].id))) {
        sortedClickedEntries.push(bookmarks[k])
        alreadyClickedEntries.set(bookmarks[k].id)
      }
    }
  }

  this.bookmarksRemarked = sortedRemarkedEntries
  this.bookmarksClicked = sortedClickedEntries
  localStorage.setObject('bookmarksSortedByRemarks', this.bookmarksRemarked)
  localStorage.setObject('bookmarksSortedByClicks', this.bookmarksClicked)
}

Remark.prototype.getBookmarks = function () {
  switch (this.sortType) {
    case 'date':
      return this.bookmarks
    case 'remarks':
      return this.bookmarksRemarked
    case 'clicks':
      return this.bookmarksClicked
  }

  return []
}

Remark.prototype.isBookmarkFiltered = function (bookmark, lastBookmark) {
  if (lastBookmark.id === bookmark.id) {
    return true
  }

  if (this.remarks !== '' && this.remarks !== '=0' && this.remarks > bookmark.remarks) {
    return true
  }

  if (this.remarks === '=0' && bookmark.remarks > 0) {
    return true
  }

  if (this.clicks !== '' && this.clicks !== '=0' && this.clicks > bookmark.clicks) {
    return true
  }

  if (this.clicks === '=0' && bookmark.clicks > 0) {
    return true
  }

  if (this.filter === '') {
    return false
  }

  // determine if single or multi term
  if (this.filter.indexOf(' ') === -1) {
    if (
      bookmark.title.toLowerCase().indexOf(this.filter) !== -1 ||
                bookmark.customtitle.toLowerCase().indexOf(this.filter) !== -1 ||
                bookmark.url.toLowerCase().indexOf(this.filter) !== -1
    ) {
      return false
    }
  } else {
    var searchTerms = this.filter.split(' ')
    for (var i = 0; i < searchTerms.length; i++) {
      if (searchTerms[i] === '') {
        continue
      }
      if (
        bookmark.title.toLowerCase().indexOf(searchTerms[i]) === -1 &&
                    bookmark.customtitle.toLowerCase().indexOf(searchTerms[i]) === -1 &&
                    bookmark.url.toLowerCase().indexOf(searchTerms[i]) === -1
      ) {
        return true
      }
    }
    return false
  }

  return true
}

Remark.prototype.extractDate = function (unixTimestamp) {
  var a = new Date(unixTimestamp * 1000)
  var year = a.getFullYear()
  var month = a.getMonth() < 9 ? '0' + (a.getMonth() + 1) : (a.getMonth() + 1)
  var date = a.getDate() < 10 ? '0' + a.getDate() : a.getDate()
  return date + '.' + month + '.' + year
}

Remark.prototype.extractTime = function (unixTimestamp) {
  var a = new Date(unixTimestamp * 1000)
  var hour = a.getHours() < 10 ? '0' + a.getHours() : a.getHours()
  var minute = a.getMinutes() < 10 ? '0' + a.getMinutes() : a.getMinutes()
  return hour + ':' + minute
}

Remark.prototype.getRemarkVisibility = function (count) {
  switch (parseInt(count)) {
    case 0:
      return 0
    case 1:
      return 0
    case 2:
      return 2
    case 3:
      return 4
    case 4:
      return 6
  }
  return 8
}

Remark.prototype.getClickVisibility = function (count) {
  switch (parseInt(count)) {
    case 0:
      return 0
    case 1:
      return 1
    case 2:
      return 2
    case 3:
      return 3
  }
  if (count <= 6) {
    return 4
  }
  if (count <= 10) {
    return 5
  }
  if (count <= 15) {
    return 6
  }
  if (count <= 20) {
    return 7
  }

  return 8
}

Remark.prototype.login = function () {
  // no authorization -> no bookmarks cache
  console.log('not logged in')
  this.storeBookmarks([])
  window.location.href = 'login.php'
}

Remark.prototype.getUrlParameter = function (key) {
  var regexS = '[\\?&]' + key + '=([^&#]*)'
  var regex = new RegExp(regexS)
  var results = regex.exec(location.href)
  return results == null ? null : results[1]
}

Storage.prototype.setObject = function (key, value) {
  this.setItem(key, JSON.stringify(value))
}

Storage.prototype.getObject = function (key) {
  return JSON.parse(this.getItem(key))
}
