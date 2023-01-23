function Remark (config) {
  this.readConfig(config)
  this.initialize()
  this.listen()
}

Remark.prototype.readConfig = function (config) {
  this.apiUrl = config.apiUrl
  this.indexPath = config.indexPath
  this.loginUrl = config.loginUrl
  this.authorizationCookie = config.authorizationCookie
  this.addButtonId = config.addButtonId ? '#' + config.addButtonId : '#add'
  this.containerDivId = config.containerDivId ? '#' + config.containerDivId : '#items'
  this.filterInputId = config.filterInputId ? '#' + config.filterInputId : '#filter'
  // when having a lot of results after this amount the list will be rendered to show fast results
  this.firstEntriesCount = 30
  this.wto = 0
  this.filter = $(this.filterInputId).val()
  this.bookmarks = localStorage.getObject('bookmarks') || []
  this.maxCount = this.getUrlParameter('items')
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

  $('#edit').on('change', function (event) {
    self.edit($(this).val().trim())
  })

  // react on changing sort type
  $(this.sortTypeSelectSelector).change(function () {
    self.setSortType(this.value)
    clearTimeout(self.wto)
    self.wto = setTimeout(function () {
      self.printBookmarks()
    }, 500)
  })

  $(self.addButtonId).click(function () {
    var url = $(self.filterInputId).val()
    self.addRemark(url)
  })

  $(self.filterInputId).focus()
}

Remark.prototype.addRemark = function (url) {
  var self = this
  self.setAjaxAuthentification()
  $.post(
    self.apiUrl + 'remark/',
    'url=' + url,
    function (result) {
      location.href = self.indexPath
    }
  )
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
    return
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
  self.setAjaxAuthentification()
  $.getJSON(jsonUrl, function (bookmarks) {
    self.storeBookmarks(bookmarks)
    self.printBookmarks()
  }).fail(function (jqXHR) {
    if (jqXHR.status === 401) {
      self.login()
    } else {
      console.log('something is wrong')
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
    if (this.isBookmarkFiltered(bookmarks[i], i === 0 ? { ID: null } : bookmarks[previousId])) {
      continue
    }
    if (self.maxCount !== null && self.maxCount === bookmarksHtmlCreated) {
      continue
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
    self.setAjaxAuthentification()
    $.post(
      self.apiUrl + 'click/',
      'id=' + $anker.closest('div').data('id'),
      function (result) {
        self.refresh()
      }
    )
  })
}

Remark.prototype.printBookmark = function (bookmark) {
  var fourDivs = '<div></div><div></div><div></div><div></div>'
  return '<div data-id="' + bookmark.ID + '" class="row item">' +
           '<div class="12 col">' +
           '<span class="date" onclick="edit(\'' + bookmark.ID + '\')">' + this.extractDate(bookmark.CreatedAt) + '</span>' +
           '<span class="time">' + this.extractTime(bookmark.CreatedAt) + '</span>' +
           '<div class="icon remark level' + this.getRemarkVisibility(bookmark.RemarkCount) + '">' + fourDivs + '</div>' +
           '<div class="icon click level' + this.getClickVisibility(bookmark.ClickCount) + '">' + fourDivs + '</div>' +
           '<div data-id="' + bookmark.ID + '" class="website">' +
           '<span class="title">' +
           '<a target="_blank" href="' + bookmark.Url + '">' +
           bookmark.Title +
           '</a>' +
           '</span>' +
           '</div>' +
           '</div>' +
           '</div>'
}

edit = function (id) {
  $('#edit').val(id).trigger('change')
}

Remark.prototype.edit = function (id) {
  var self = this

  var bookmarks = self.bookmarks.Bookmarks

  var editBookmark

  for (var i = 0; i < bookmarks.length; i++) {
    if (bookmarks[i].ID === Number(id)) {
      editBookmark = bookmarks[i]
      break
    }
  }

  var newTitle = prompt('change title for\n\n' + editBookmark.Url + '\n', editBookmark.Title)

  if (newTitle) {
    self.setAjaxAuthentification()
    $.post(
      self.apiUrl + id + '/',
      'title=' + newTitle,
      function (result) {
        self.refresh()
      }
    )
  }
}

Remark.prototype.storeBookmarks = function (bookmarks) {
  var self = this
  self.bookmarks = bookmarks
  localStorage.setObject('bookmarks', self.bookmarks)
}

Remark.prototype.getBookmarks = function () {
  var bookmarkMap = {}
  for (var i = 0; i < this.bookmarks.Bookmarks.length; i++) {
    bookmarkMap[this.bookmarks.Bookmarks[i].ID] = this.bookmarks.Bookmarks[i]
  }
  var returnBookmarks = []
  for (var j = 0; j < this.bookmarks.Remarks.length; j++) {
    returnBookmarks.push(bookmarkMap[this.bookmarks.Remarks[j].BookmarkID])
  }
  return returnBookmarks
}

Remark.prototype.isBookmarkFiltered = function (bookmark, lastBookmark) {
  // make sure to not show twice the same entry even if it was remarked after another
  if (lastBookmark.ID === bookmark.ID) {
    return true
  }

  if (this.filter === '') {
    return false
  }

  // determine if single or multi term
  if (this.filter.indexOf(' ') === -1) {
    if (
      bookmark.Title.toLowerCase().indexOf(this.filter) !== -1 ||
                bookmark.Url.toLowerCase().indexOf(this.filter) !== -1
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
        bookmark.Title.toLowerCase().indexOf(searchTerms[i]) === -1 &&
                    bookmark.Url.toLowerCase().indexOf(searchTerms[i]) === -1
      ) {
        return true
      }
    }
    return false
  }

  return true
}

Remark.prototype.extractDate = function (dateString) {
  return dateString.split('T')[0].split('-').reverse().join('.')
}

Remark.prototype.extractTime = function (dateString) {
  var splits = dateString.split('T')[1].split('.')[0].split(':')
  return splits[0] + ':' + splits[1]
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
  console.log('not logged in, redirecting to ' + this.loginUrl)
  this.storeBookmarks({ Bookmarks: [], Remarks: [], Clicks: [] })
  this.printBookmarks()
  window.location.href = this.loginUrl
}

Remark.prototype.getUrlParameter = function (key) {
  var regexS = '[\\?&]' + key + '=([^&#]*)'
  var regex = new RegExp(regexS)
  var results = regex.exec(location.href)
  return results == null ? null : results[1]
}

Remark.prototype.setAjaxAuthentification = function () {
  var self = this
  $.ajaxSetup({
    headers: {
      Authorization: $.cookie(self.authorizationCookie)
    }
  })
}

Storage.prototype.setObject = function (key, value) {
  this.setItem(key, JSON.stringify(value))
}

Storage.prototype.getObject = function (key) {
  return JSON.parse(this.getItem(key))
}
