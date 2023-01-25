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
  const self = this

  // react on filterfield typing
  $(self.filterInputId).on('input', function (event) {
    self.filter = $(this).val().toLowerCase().trim()

    clearTimeout(self.wto)
    self.wto = setTimeout(function () {
      self.printBookmarks()
    }, 500)
  })

  $('#edit').on('change', function (event) {
    self.edit($(this).val())
  })

  $('#delete').on('change', function (event) {
    self.delete($(this).val())
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
    const url = $(self.filterInputId).val()
    self.addRemark(url)
  })

  $(self.filterInputId).focus()
}

Remark.prototype.addRemark = function (url) {
  const self = this
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
  const externalRemark = this.getUrlParameter('remark')
  if (externalRemark) {
    this.addRemark(externalRemark)
  }

  if (this.bookmarks.length !== 0) {
    // just print the old stuff at first
    this.printBookmarks()
  }
  this.refresh()
}

Remark.prototype.refresh = function () {
  console.log('refreshing')
  const self = this
  const jsonUrl = self.apiUrl
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
  const self = this
  let html = ''
  let bookmarksHtmlCreated = 0
  let previousId = 0
  const bookmarks = self.getBookmarks()
  for (let i = 0; i < bookmarks.length; i++) {
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
    const $anker = $(this)
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
  const fourDivs = '<div></div><div></div><div></div><div></div>'
  return '<div data-id="' + bookmark.ID + '" class="row item">' +
           '<div class="12 col">' +
           '<span class="date" onclick="triggerLineAction(\'edit\', \'' + bookmark.ID + '\')">' + this.extractDate(bookmark.CreatedAt) + '</span>' +
           '<span class="time">' + this.extractTime(bookmark.CreatedAt) + '</span>' +
           '<div class="icon remark level' + this.getRemarkVisibility(bookmark.RemarkCount) + '">' + fourDivs + '</div>' +
           '<div class="icon click level' + this.getClickVisibility(bookmark.ClickCount) + '">' + fourDivs + '</div>' +
           '<div data-id="' + bookmark.ID + '" class="website">' +
           '<span class="title">' +
           '<a target="_blank" href="' + bookmark.Url + '">' +
           bookmark.Title +
           '</a>' +
           '</span>' +
           '<span class="delete" onclick="triggerLineAction(\'delete\', \'' + bookmark.ID + '\')">&#128465;</span>' +
           '</div>' +
           '</div>' +
           '</div>'
}

Remark.prototype.getBookmarkById = function (id) {
  const self = this
  const bookmarks = self.bookmarks.Bookmarks
  const foundBookmark = null
  for (let i = 0; i < bookmarks.length; i++) {
    if (bookmarks[i].ID === Number(id)) {
      return bookmarks[i]
    }
  }
  return foundBookmark
}

Remark.prototype.edit = function (id) {
  const self = this
  const editBookmark = self.getBookmarkById(id)
  const newTitle = prompt('change title for\n\n' + editBookmark.Url + '\n', editBookmark.Title)

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

Remark.prototype.delete = function (id) {
  const self = this
  const deleteBookmark = self.getBookmarkById(id)
  const deletePrompt = confirm('delete this bookmark?\n\n' + deleteBookmark.Url + '\n\n' + deleteBookmark.Title)
  if (deletePrompt) {
    self.setAjaxAuthentification()
    $.ajax({
      url: self.apiUrl + id + '/',
      type: 'DELETE',
      success: function (result) {
        self.refresh()
      }
    })
  }
}

Remark.prototype.storeBookmarks = function (bookmarks) {
  const self = this
  self.bookmarks = bookmarks
  localStorage.setObject('bookmarks', self.bookmarks)
}

Remark.prototype.getBookmarks = function () {
  const bookmarkMap = {}
  for (let i = 0; i < this.bookmarks.Bookmarks.length; i++) {
    bookmarkMap[this.bookmarks.Bookmarks[i].ID] = this.bookmarks.Bookmarks[i]
  }
  const returnBookmarks = []
  for (let j = 0; j < this.bookmarks.Remarks.length; j++) {
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
    const searchTerms = this.filter.split(' ')
    for (let i = 0; i < searchTerms.length; i++) {
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
  const splits = dateString.split('T')[1].split('.')[0].split(':')
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
  const regexS = '[\\?&]' + key + '=([^&#]*)'
  const regex = new RegExp(regexS)
  const results = regex.exec(location.href)
  return results == null ? null : results[1]
}

Remark.prototype.setAjaxAuthentification = function () {
  const self = this
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

triggerLineAction = function (action, id) {
  $('#' + action).val(id.trim()).trigger('change')
}
